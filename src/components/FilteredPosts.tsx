import { byDate } from "../utils";
import { Post } from "./Post";

export function FilteredPosts({ posts, tag }: { posts: any[]; tag: string }) {
  return (
    <div>
      {posts.sort(byDate).map((post) => (
        <div key={post.id} class="pb-[100px]">
          <Post post={post} />
        </div>
      ))}
    </div>
  );
}
