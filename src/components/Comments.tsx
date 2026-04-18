import { useEffect, useState } from "preact/hooks";

interface Comment {
	id: string;
	content: string;
	createdAt: number;
	user: {
		username: string;
		avatar: string;
	};
	likes: number;
	likedByUser: boolean;
}

interface CommentsProps {
	postId: string; // Or slug
	lang?: "en-SG" | "zh";
	currentUser?: {
		username: string;
		avatar: string | null | undefined;
	};
}

const messages = {
	"en-SG": {
		title: "Transmissions",
		loginToLike: "Please login to like",
		placeholder: "Broadcast a response...",
		sending: "Sending...",
		submit: "Transmit",
		loginPrompt: "Identify yourself to join the frequency.",
		loginButton: "Login to Comment",
		loading: "Scanning frequencies...",
	},
	zh: {
		title: "评论",
		loginToLike: "请先登录后点赞",
		placeholder: "写点什么吧...",
		sending: "发送中...",
		submit: "发送",
		loginPrompt: "登录后即可参与评论。",
		loginButton: "登录后评论",
		loading: "正在加载评论...",
	},
} as const;

export default function Comments({
	postId,
	lang = "en-SG",
	currentUser,
}: CommentsProps) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [newComment, setNewComment] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const copy = messages[lang];

	useEffect(() => {
		fetchComments();
	}, [postId]);

	async function fetchComments() {
		try {
			const res = await fetch(`/api/comments?postId=${postId}`);
			const data = (await res.json()) as Comment[];
			setComments(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!newComment.trim()) return;
		setSubmitting(true);

		try {
			const res = await fetch("/api/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ postId, content: newComment }),
			});
			if (res.ok) {
				setNewComment("");
				fetchComments(); // Refresh
			}
		} catch (err) {
			console.error(err);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleLike(commentId: string, currentLiked: boolean) {
		if (!currentUser) return alert(copy.loginToLike);

		// Optimistic UI
		setComments(
			comments.map((c) => {
				if (c.id === commentId) {
					return {
						...c,
						likes: currentLiked ? c.likes - 1 : c.likes + 1,
						likedByUser: !currentLiked,
					};
				}
				return c;
			}),
		);

		try {
			await fetch("/api/likes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ commentId, value: currentLiked ? 0 : 1 }), // 0 to remove like (simplified logic)
			});
		} catch (err) {
			console.error(err);
			fetchComments(); // Revert on error
		}
	}

	return (
		<div class="mt-12 border-t border-white/10 pt-8">
			<h3 class="text-2xl font-bold font-display mb-6">
				{copy.title} ({comments.length})
			</h3>

			{/* Comment Form */}
			{currentUser ? (
				<form onSubmit={handleSubmit} class="mb-8">
					<div class="flex gap-4">
						<img
							src={
								currentUser.avatar ||
								`https://ui-avatars.com/api/?name=${currentUser.username}`
							}
							alt={`${currentUser.username} avatar`}
							class="w-10 h-10 rounded-full border border-white/10"
						/>
						<div class="flex-1">
							<textarea
								value={newComment}
								onInput={(e) =>
									setNewComment((e.target as HTMLTextAreaElement).value)
								}
								class="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-accent text-white resize-none"
								rows={3}
								placeholder={copy.placeholder}
							/>
							<div class="flex justify-end mt-2">
								<button
									type="submit"
									disabled={submitting || !newComment.trim()}
									class="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors disabled:opacity-50"
								>
									{submitting ? copy.sending : copy.submit}
								</button>
							</div>
						</div>
					</div>
				</form>
			) : (
				<div class="bg-white/5 rounded-xl p-6 text-center mb-8">
					<p class="text-gray-400 mb-4">{copy.loginPrompt}</p>
					<a
						href={lang === "zh" ? "/zh/login" : "/login"}
						class="px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
					>
						{copy.loginButton}
					</a>
				</div>
			)}

			{/* Comment List */}
			{loading ? (
				<div class="text-center text-gray-500 py-8">{copy.loading}</div>
			) : (
				<div class="space-y-6">
					{comments.map((comment) => (
						<div key={comment.id} class="group animate-fade-in">
							<div class="flex gap-4">
								<div class="shrink-0">
									<img
										src={
											comment.user.avatar ||
											`https://ui-avatars.com/api/?name=${comment.user.username}`
										}
										alt={`${comment.user.username} avatar`}
										class="w-10 h-10 rounded-full border border-white/10"
									/>
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<span class="font-bold text-white text-sm">
											{comment.user.username}
										</span>
										<span class="text-xs text-gray-500">
											{new Date(comment.createdAt).toLocaleDateString()}
										</span>
									</div>
									<div class="text-gray-300 text-sm leading-relaxed mb-2">
										{comment.content}
									</div>
									<div class="flex items-center gap-4">
										<button
											type="button"
											onClick={() =>
												handleLike(comment.id, comment.likedByUser)
											}
											class={`flex items-center gap-1 text-xs font-bold transition-colors ${comment.likedByUser ? "text-pink-500" : "text-gray-500 hover:text-white"}`}
										>
											<span
												class={
													comment.likedByUser
														? "i-heroicons-heart-solid"
														: "i-heroicons-heart"
												}
											></span>
											{comment.likes}
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
