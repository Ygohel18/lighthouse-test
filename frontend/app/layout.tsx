// app/layout.tsx
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
	title: 'Lighthouse Performance Dashboard',
	description: 'Automated web performance testing',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<div className="relative flex min-h-screen flex-col">
						<Header />
						<main className="flex-1">{children}</main>
						<Footer />
					</div>
				</Providers>
			</body>
		</html>
	);
}