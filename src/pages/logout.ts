import type { APIRoute } from 'astro';
import { invalidateSession } from '../lib/session';
import { getDb } from '../lib/db';

export const POST: APIRoute = async ({ cookies, locals }) => {
	const sessionToken = cookies.get('session')?.value;
	
	if (sessionToken) {
		const db = getDb(locals.runtime.env);
		await invalidateSession(sessionToken, db, locals.runtime.env);
	}
	
	cookies.delete('session', { path: '/' });
	
	// Return HTML success page instead of direct redirect
	const html = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Logout Successful</title>
		<script src="https://cdn.tailwindcss.com"></script>
		<meta http-equiv="refresh" content="2;url=/">
	</head>
	<body class="bg-[#0a0a0a] text-white flex items-center justify-center min-h-screen">
		<div class="text-center space-y-4 p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl max-w-sm w-full mx-4 shadow-2xl">
			<div class="relative w-16 h-16 mx-auto mb-4">
				<div class="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
				<div class="relative bg-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center border border-blue-500/20">
					<svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</div>
			</div>
			<h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">See You Soon!</h2>
			<p class="text-gray-400 text-sm">Successfully logged out.</p>
			<p class="text-gray-500 text-xs mt-2">Redirecting to homepage...</p>
			<div class="w-full bg-white/5 rounded-full h-1 mt-6 overflow-hidden">
				<div class="bg-blue-500 h-full w-full origin-left animate-[progress_2s_ease-in-out_infinite]"></div>
			</div>
		</div>
		<script>
			setTimeout(() => {
				window.location.href = "/";
			}, 1500);
		</script>
		<style>
			@keyframes progress {
				0% { transform: scaleX(0); }
				100% { transform: scaleX(1); }
			}
		</style>
	</body>
	</html>
	`;
	
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		}
	});
};
