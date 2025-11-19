import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FrontendTask, FrontendLighthouseResultPartial } from '@/types';

export async function generateProfessionalPDF(task: FrontendTask) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('Lighthouse Performance Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Test Overview Section
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Test Overview', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const overviewData = [
    ['Task ID', task.taskId],
    ['URL', task.url],
    ['Status', task.status.toUpperCase()],
    ['Created', new Date(task.createdAt).toLocaleString()],
    ['Total Tests', task.results.length.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: overviewData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Results by Device/Configuration
  for (const result of task.results) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Configuration Header
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    const configTitle = `${result.config.device.toUpperCase()} - ${result.config.browser} (${result.config.location})`;
    doc.text(configTitle, 14, yPosition);
    yPosition += 8;

    if (result.status === 'completed' && result.report) {
      // Performance Score
      const perfScore = result.report.categories.performance?.score;
      if (perfScore !== undefined) {
        const scorePercent = Math.round(perfScore * 100);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Performance Score: ${scorePercent}/100`, 14, yPosition);
        
        // Score bar
        const barWidth = 100;
        const barHeight = 8;
        const scoreWidth = (scorePercent / 100) * barWidth;
        const barColor = scorePercent >= 90 ? [34, 197, 94] : scorePercent >= 50 ? [251, 191, 36] : [239, 68, 68];
        
        doc.setFillColor(220, 220, 220);
        doc.rect(120, yPosition - 5, barWidth, barHeight, 'F');
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.rect(120, yPosition - 5, scoreWidth, barHeight, 'F');
        
        yPosition += 12;
      }

      // Core Web Vitals
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Core Web Vitals', 14, yPosition);
      yPosition += 8;

      const metricsData = [];
      const audits = result.report.audits;

      if (audits['first-contentful-paint']) {
        metricsData.push([
          'First Contentful Paint (FCP)',
          audits['first-contentful-paint'].displayValue || 'N/A',
          getScoreLabel(audits['first-contentful-paint'].score),
        ]);
      }
      if (audits['largest-contentful-paint']) {
        metricsData.push([
          'Largest Contentful Paint (LCP)',
          audits['largest-contentful-paint'].displayValue || 'N/A',
          getScoreLabel(audits['largest-contentful-paint'].score),
        ]);
      }
      if (audits['cumulative-layout-shift']) {
        metricsData.push([
          'Cumulative Layout Shift (CLS)',
          audits['cumulative-layout-shift'].displayValue || 'N/A',
          getScoreLabel(audits['cumulative-layout-shift'].score),
        ]);
      }
      if (audits['total-blocking-time']) {
        metricsData.push([
          'Total Blocking Time (TBT)',
          audits['total-blocking-time'].displayValue || 'N/A',
          getScoreLabel(audits['total-blocking-time'].score),
        ]);
      }
      if (audits['speed-index']) {
        metricsData.push([
          'Speed Index',
          audits['speed-index'].displayValue || 'N/A',
          getScoreLabel(audits['speed-index'].score),
        ]);
      }

      if (metricsData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value', 'Rating']],
          body: metricsData,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 50, halign: 'right' },
            2: { cellWidth: 40, halign: 'center' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Opportunities (Top 5)
      const opportunities = getTopOpportunities(result, 5);
      if (opportunities.length > 0) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Top Opportunities', 14, yPosition);
        yPosition += 8;

        const oppData = opportunities.map(opp => [
          opp.title,
          opp.displayValue || 'N/A',
          `${Math.round((opp.score || 0) * 100)}`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Opportunity', 'Savings', 'Score']],
          body: oppData,
          theme: 'striped',
          headStyles: { fillColor: [251, 191, 36], textColor: 0 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 30, halign: 'center' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

    } else {
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text(`Status: ${result.status}`, 14, yPosition);
      if (result.errorMessage) {
        yPosition += 6;
        doc.text(`Error: ${result.errorMessage}`, 14, yPosition);
      }
      yPosition += 10;
    }

    yPosition += 5;
  }

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | Lighthouse Performance Report`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
}

function getScoreLabel(score: number | undefined): string {
  if (score === undefined || score === null) return 'N/A';
  if (score >= 0.9) return 'Good';
  if (score >= 0.5) return 'Needs Improvement';
  return 'Poor';
}

function getTopOpportunities(result: FrontendLighthouseResultPartial, limit: number) {
  if (!result.report) return [];
  
  const opportunities = [];
  const perfCategory = result.report.categories.performance;
  
  if (perfCategory && perfCategory.auditRefs) {
    for (const ref of perfCategory.auditRefs) {
      const audit = result.report.audits[ref.id];
      if (audit && audit.details && audit.scoreDisplayMode === 'numeric' && (audit.score || 0) < 1) {
        opportunities.push(audit);
      }
    }
  }

  return opportunities
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, limit);
}

export async function downloadPDF(task: FrontendTask) {
  const doc = await generateProfessionalPDF(task);
  const fileName = `lighthouse-report-${task.taskId}-${Date.now()}.pdf`;
  doc.save(fileName);
}
