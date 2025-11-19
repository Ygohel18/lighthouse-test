'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube, FaHeart } from 'react-icons/fa';

export function Footer() {
	return (
		<footer className="mt-auto border-t bg-background/60 backdrop-blur-xl">
			<div className="container mx-auto px-6 py-6">
				<div className="flex flex-col items-center text-center gap-4">

					{/* Social Icons */}
					<div className="flex items-center gap-5">
						<Link
							href="https://facebook.com/planckstudio"
							target="_blank"
							className="transition-all hover:scale-110"
						>
							<FaFacebook className="h-5 w-5 opacity-75 hover:opacity-100" />
						</Link>

						<Link
							href="https://instagram.com/planckstudio"
							target="_blank"
							className="transition-all hover:scale-110"
						>
							<FaInstagram className="h-5 w-5 opacity-75 hover:opacity-100" />
						</Link>

						<Link
							href="https://youtube.com/@planckstudio"
							target="_blank"
							className="transition-all hover:scale-110"
						>
							<FaYoutube className="h-5 w-5 opacity-75 hover:opacity-100" />
						</Link>
					</div>

					{/* Branding */}
					<div className="text-sm text-muted-foreground flex items-center gap-1">
						Built with <FaHeart className="text-red-500 mx-1" /> by
						<Link
							href="https://planckstudio.in"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium inline-flex items-center gap-1 hover:text-primary transition-colors"
						>
							PlanckStudio
							<ExternalLink className="h-3 w-3" />
						</Link>
					</div>

					{/* Extra */}
					<p className="text-xs text-muted-foreground flex items-center gap-1">
						Hosted on
						<Link
							href="https://hostingspell.com"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium inline-flex items-center gap-1 hover:text-primary transition-colors"
						>
							HostingSpell
							<ExternalLink className="h-3 w-3" />
						</Link>
					</p>
				</div>
			</div>
		</footer>
	);
}
