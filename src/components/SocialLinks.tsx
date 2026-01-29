import { useState, useEffect } from "preact/hooks";

interface SocialLink {
  label: string;
  url: string;
  icon: string;
  color?: string;
}

interface Props {
  initialLinks: SocialLink[];
}

const gravatarHash = "60eb98ab51a815a519feeca028e08573";

export default function SocialLinks({ initialLinks }: Props) {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);

  useEffect(() => {
    const fetchGravatar = async () => {
      try {
        const res = await fetch(`https://en.gravatar.com/${gravatarHash}.json`, { 
             // Using no-cors might be needed if CORS is an issue, but standard fetch often works for simple GETs from browser 
             // Gravatar supports JSONP or CORS usually. Let's try standard fetch first.
        });
        
        if (res.ok) {
          const data = await res.json();
          const entry = data.entry[0];
          const newLinks: SocialLink[] = [];

          // Helper to map service to icon
          const getServiceIcon = (service: string) => {
            const map: Record<string, string> = {
              github: "i-simple-icons-github",
              twitter: "i-simple-icons-x",
              facebook: "i-simple-icons-facebook",
              instagram: "i-simple-icons-instagram",
              linkedin: "i-simple-icons-linkedin",
              discord: "i-simple-icons-discord",
              youtube: "i-simple-icons-youtube",
              reddit: "i-simple-icons-reddit",
              medium: "i-simple-icons-medium",
              stackoverflow: "i-simple-icons-stackoverflow",
              twitch: "i-simple-icons-twitch",
              steam: "i-simple-icons-steam",
              telegram: "i-simple-icons-telegram",
            };
            return map[service] || "i-heroicons-link";
          };

          // 1. Verified Accounts
          if (entry.accounts) {
            entry.accounts.forEach((acc: any) => {
              newLinks.push({
                label: acc.display || acc.username || acc.shortname,
                url: acc.url,
                icon: getServiceIcon(acc.shortname),
                color: "hover:text-white",
              });
            });
          }

          // 2. Custom URLs
          if (entry.urls) {
            entry.urls.forEach((link: any) => {
              let icon = "i-heroicons-globe-alt";
              let label = link.title;
              const url = link.value;

              if (url.includes("github.com")) icon = "i-simple-icons-github";
              else if (url.includes("twitter.com") || url.includes("x.com"))
                icon = "i-simple-icons-x";
              else if (url.includes("linkedin.com"))
                icon = "i-simple-icons-linkedin";
              else if (url.includes("threads.net"))
                 icon = "i-simple-icons-threads";
              else if (url.includes("tiktok.com"))
                 icon = "i-simple-icons-tiktok";

              // Avoid duplicates if possible, but simplistic append is okay for now
              // or we can replace entirely if we trust Gravatar to have everything
              newLinks.push({ label, url, icon });
            });
          }

          if (newLinks.length > 0) {
              setLinks(newLinks);
          }
        }
      } catch (e) {
        console.error("Failed to fetch Gravatar profile client-side", e);
      }
    };

    fetchGravatar();
  }, []);

  return (
    <div class="mt-8">
      <h3 class="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">
        Connect
      </h3>
      <div class="flex flex-wrap gap-3 justify-center md:justify-start">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5"
          >
            <span
              class={`${link.icon} text-sm group-hover:text-white transition-colors`}
            ></span>
            <span class="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
