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
  doc.setTextColor(37, 99, 235);
  doc.text('Website Performance Report', pageWidth / 2, yPosition, { align: 'center' });
  
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
    yPosition += 10;

    if (result.status === 'completed' && result.report) {
      // ALL LIGHTHOUSE SCORES
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Lighthouse Scores', 14, yPosition);
      yPosition += 8;

      const scoresData = [];
      const categories = result.report.categories;

      if (categories.performance) {
        scoresData.push([
          'Performance',
          Math.round(categories.performance.score! * 100).toString(),
          getScoreLabel(categories.performance.score),
        ]);
      }
      if (categories.accessibility) {
        scoresData.push([
          'Accessibility',
          Math.round(categories.accessibility.score! * 100).toString(),
          getScoreLabel(categories.accessibility.score),
        ]);
      }
      if (categories['best-practices']) {
        scoresData.push([
          'Best Practices',
          Math.round(categories['best-practices'].score! * 100).toString(),
          getScoreLabel(categories['best-practices'].score),
        ]);
      }
      if (categories.seo) {
        scoresData.push([
          'SEO',
          Math.round(categories.seo.score! * 100).toString(),
          getScoreLabel(categories.seo.score),
        ]);
      }
      if (categories.pwa) {
        scoresData.push([
          'PWA',
          Math.round(categories.pwa.score! * 100).toString(),
          getScoreLabel(categories.pwa.score),
        ]);
      }

      if (scoresData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Score', 'Rating']],
          body: scoresData,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 60, halign: 'center' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // CORE WEB VITALS (Customer-Centric)
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Core Web Vitals (User Experience)', 14, yPosition);
      yPosition += 8;

      const metricsData = [];
      const audits = result.report.audits;

      if (audits['first-contentful-paint']) {
        metricsData.push([
          'First Contentful Paint (FCP)',
          audits['first-contentful-paint'].displayValue || 'N/A',
          getScoreLabel(audits['first-contentful-paint'].score),
          'Time until first content appears',
        ]);
      }
      if (audits['largest-contentful-paint']) {
        metricsData.push([
          'Largest Contentful Paint (LCP)',
          audits['largest-contentful-paint'].displayValue || 'N/A',
          getScoreLabel(audits['largest-contentful-paint'].score),
          'Time until main content loads',
        ]);
      }
      if (audits['cumulative-layout-shift']) {
        metricsData.push([
          'Cumulative Layout Shift (CLS)',
          audits['cumulative-layout-shift'].displayValue || 'N/A',
          getScoreLabel(audits['cumulative-layout-shift'].score),
          'Visual stability score',
        ]);
      }
      if (audits['total-blocking-time']) {
        metricsData.push([
          'Total Blocking Time (TBT)',
          audits['total-blocking-time'].displayValue || 'N/A',
          getScoreLabel(audits['total-blocking-time'].score),
          'Time page is unresponsive',
        ]);
      }
      if (audits['speed-index']) {
        metricsData.push([
          'Speed Index',
          audits['speed-index'].displayValue || 'N/A',
          getScoreLabel(audits['speed-index'].score),
          'Visual load speed',
        ]);
      }
      if (audits['interactive']) {
        metricsData.push([
          'Time to Interactive (TTI)',
          audits['interactive'].displayValue || 'N/A',
          getScoreLabel(audits['interactive'].score),
          'Time until fully interactive',
        ]);
      }

      if (metricsData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value', 'Rating', 'Description']],
          body: metricsData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30, halign: 'right' },
            2: { cellWidth: 35, halign: 'center' },
            3: { cellWidth: 55, fontSize: 7 },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // ADDITIONAL PERFORMANCE METRICS
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Additional Performance Metrics', 14, yPosition);
      yPosition += 8;

      const additionalMetrics = [];

      if (audits['server-response-time']) {
        additionalMetrics.push([
          'Server Response Time',
          audits['server-response-time'].displayValue || 'N/A',
          getScoreLabel(audits['server-response-time'].score),
        ]);
      }
      if (audits['first-meaningful-paint']) {
        additionalMetrics.push([
          'First Meaningful Paint',
          audits['first-meaningful-paint'].displayValue || 'N/A',
          getScoreLabel(audits['first-meaningful-paint'].score),
        ]);
      }
      if (audits['max-potential-fid']) {
        additionalMetrics.push([
          'Max Potential FID',
          audits['max-potential-fid'].displayValue || 'N/A',
          getScoreLabel(audits['max-potential-fid'].score),
        ]);
      }

      if (additionalMetrics.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value', 'Rating']],
          body: additionalMetrics,
          theme: 'striped',
          headStyles: { fillColor: [147, 51, 234], textColor: 255 },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 50, halign: 'right' },
            2: { cellWidth: 40, halign: 'center' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // RESOURCE SUMMARY
      if (audits['resource-summary'] && audits['resource-summary'].details) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Resource Summary', 14, yPosition);
        yPosition += 8;

        const resourceData: string[][] = [];
        const details = audits['resource-summary'].details as any;
        
        if (details.items) {
          details.items.forEach((item: any) => {
            resourceData.push([
              item.resourceType || 'Unknown',
              item.requestCount?.toString() || '0',
              formatBytes(item.size || 0),
              formatBytes(item.transferSize || 0),
            ]);
          });
        }

        if (resourceData.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            head: [['Resource Type', 'Requests', 'Size', 'Transfer Size']],
            body: resourceData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 35, halign: 'center' },
              2: { cellWidth: 40, halign: 'right' },
              3: { cellWidth: 45, halign: 'right' },
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 12;
        }
      }

      // OPPORTUNITIES (Top 10)
      const opportunities = getTopOpportunities(result, 10);
      if (opportunities.length > 0) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Optimization Opportunities', 14, yPosition);
        yPosition += 8;

        const oppData = opportunities.map((opp, index) => [
          `${index + 1}`,
          opp.title.substring(0, 60) + (opp.title.length > 60 ? '...' : ''),
          opp.displayValue || 'N/A',
          `${Math.round((opp.score || 0) * 100)}`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Opportunity', 'Potential Savings', 'Score']],
          body: oppData,
          theme: 'striped',
          headStyles: { fillColor: [251, 191, 36], textColor: 0 },
          styles: { fontSize: 7, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 95 },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 30, halign: 'center' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // DIAGNOSTICS
      const diagnostics = getDiagnostics(result, 8);
      if (diagnostics.length > 0) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Diagnostics & Issues', 14, yPosition);
        yPosition += 8;

        const diagData = diagnostics.map((diag, index) => [
          `${index + 1}`,
          diag.title.substring(0, 70) + (diag.title.length > 70 ? '...' : ''),
          diag.displayValue || 'Check details',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Issue', 'Details']],
          body: diagData,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68], textColor: 255 },
          styles: { fontSize: 7, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 110 },
            2: { cellWidth: 50, halign: 'right' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
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

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | Website Performance Report | ${task.url}`,
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

function getDiagnostics(result: FrontendLighthouseResultPartial, limit: number) {
  if (!result.report) return [];
  
  const diagnostics = [];
  const perfCategory = result.report.categories.performance;
  
  if (perfCategory && perfCategory.auditRefs) {
    for (const ref of perfCategory.auditRefs) {
      const audit = result.report.audits[ref.id];
      if (audit && audit.scoreDisplayMode === 'informative' && audit.score !== null) {
        diagnostics.push(audit);
      }
    }
  }

  return diagnostics.slice(0, limit);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export async function downloadPDF(task: FrontendTask) {
  const doc = await generateProfessionalPDF(task);
  const fileName = `lighthouse-report-${task.taskId}-${Date.now()}.pdf`;
  doc.save(fileName);
}
