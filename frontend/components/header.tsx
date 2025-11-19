'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();

	const navItems = [
		{ href: '/', label: 'Dashboard' }
	];

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8">
				<Link href="/" className="flex items-center space-x-2 mr-4">
					<Activity className="h-6 w-6 text-blue-600" />
					<span className="font-bold text-lg hidden sm:inline-block">
						Lighthouse
					</span>
				</Link>

				<nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'transition-colors hover:text-foreground/80',
								pathname === item.href
									? 'text-foreground'
									: 'text-foreground/60'
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="flex flex-1 items-center justify-end md:hidden">
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								{isOpen ? (
									<X className="h-5 w-5" />
								) : (
									<Menu className="h-5 w-5" />
								)}
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[240px] sm:w-[300px]">
							<SheetHeader>
								<SheetTitle>Navigation</SheetTitle>
							</SheetHeader>
							<nav className="flex flex-col space-y-4 mt-6">
								{navItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setIsOpen(false)}
										className={cn(
											'text-lg transition-colors hover:text-foreground/80',
											pathname === item.href
												? 'text-foreground font-semibold'
												: 'text-foreground/60'
										)}
									>
										{item.label}
									</Link>
								))}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
