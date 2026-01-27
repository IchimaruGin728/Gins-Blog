import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-wasm';
import { getDb } from '../../lib/db';
import { posts } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { initWasm } from '@resvg/resvg-wasm';

// We need to initialize the WASM
// In generic Node/Cloudflare workers, dynamic imports might be needed or just init once.
// For Astro Cloudflare adapter, usually it just works or we pass the wasm module.
// However, @resvg/resvg-wasm might need manual init if mostly used in Node.
// Let's try standard import first.

// Font loader
async function loadGoogleFont(font: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
  if (!resource) return null;
  const res = await fetch(resource[1]);
  return await res.arrayBuffer();
}

export const GET: APIRoute = async ({ params, locals }) => {
    const { slug } = params;
    if (!slug) return new Response('Not found', { status: 404 });

    const db = getDb(locals.runtime.env);
    const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();

    if (!post) return new Response('Not found', { status: 404 });

    // Load Fonts (Inter Bold and Regular)
    // Caching these would be good in production
    const fontData = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff').then(res => res.arrayBuffer());
    const fontDataRegular = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff').then(res => res.arrayBuffer());

    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#050505',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                    color: 'white',
                    fontFamily: 'Inter',
                },
                children: [
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                            }
                        }
                    },
                     {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '32px',
                                padding: '60px 80px',
                                background: 'rgba(0,0,0,0.4)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                maxWidth: '900px',
                                textAlign: 'center'
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '24px',
                                            color: '#d8b4fe',
                                            marginBottom: '20px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '4px',
                                        },
                                        children: "Ichimaru Gin's Blog"
                                    }
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '64px',
                                            fontWeight: 700,
                                            background: 'linear-gradient(to right, #c084fc, #f472b6)',
                                            backgroundClip: 'text',
                                            color: 'transparent',
                                            marginBottom: '30px',
                                            lineHeight: 1.2,
                                        },
                                        children: post.title
                                    }
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '24px',
                                            color: '#9ca3af',
                                        },
                                        children: new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-SG', { dateStyle: 'long' })
                                    }
                                },
                            ]
                        }
                    }
                ],
            },
        },
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Inter',
                    data: fontData,
                    weight: 700,
                    style: 'normal',
                },
                {
                    name: 'Inter',
                    data: fontDataRegular,
                    weight: 400,
                    style: 'normal',
                },
            ],
        }
    );

    // Render SVG to PNG
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 }
    });
    
    // Cloudflare Workers usually need the WASM initialized, but @resvg/resvg-wasm auto-inits in some envs.
    // If it fails, we catch.
    try {
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return new Response(pngBuffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=604800, immutable'
            }
        });
    } catch (e) {
        // Fallback or retry init
        try {
            // Need to import wasm manually?
            // import wasm from '@resvg/resvg-wasm/index_bg.wasm';
            // await initWasm(wasm);
            // Retry render...
            // For now just error log
            console.error("Resvg render error", e);
            throw e;
        } catch (e2) {
            return new Response('Image Generation Failed', { status: 500 });
        }
    }
}
