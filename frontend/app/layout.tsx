// app/layout.tsx
import './globals.css'; // Your global styles (Tailwind)
import { Providers } from '@/components/providers'; // Import the Providers

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
				<Providers> {/* Wrap children with Providers */}
					{children}
				</Providers>
			</body>
		</html>
	);
}