import { useState, useEffect } from "react";
import { Auth, API, Storage } from "aws-amplify";
import { listPosts, postsByUsername } from "@/graphql/queries";
import Link from "next/link";
import Moment from "moment";
import { deletePost as deletePostMutation } from "@/graphql/mutations";

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { username } = await Auth.currentAuthenticatedUser();

    const postData = await API.graphql({
      query: listPosts,
      variables: { username },
    });

    const { items } = postData.data.listPosts;

    const postWithImages = await Promise.all(
      items.map(async (post) => {
        if (post.coverImage) {
          post.coverImage = await Storage.get(post.coverImage);
        }
        return post;
      })
    );

    setPosts(postWithImages);
  }

  async function deletePosts(id) {
    const resultData = await API.graphql({
      query: deletePostMutation,
      variables: { input: { id } },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    });
    fetchPosts();
  }

  return (
    <div>
      {posts.map((post, index) => (
        <div
          key={index}
          className="py-8 px-8 max-w-xxl mx-auto bg-white rounded-lg sm:items-center sm:space-y-0 sm:space-x-6 mb-2"
        >
          <div className="text-center space-y-2 sm:text-left">
            <div className="space-y-0.5">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  className="w-36 h-36 bg-contain rounded-full sm:mx-0 sm:shrink-0"
                  alt="post image"
                />
              )}
              <p className="text-lg text-black font-semibold">{post.title}</p>
              <p className="text-slate-500 font-medium">
                Created on: {Moment(post.createdAt).format("ddd, MMM hh:mm a")}
              </p>
            </div>
          </div>
          <Link href={`/edit-post/${post.id}`}>Edit Post</Link>
          <Link href={`/posts/${post.id}`}>View Post</Link>
          <button
            className="text-sm mr-4 text-red-500"
            onClick={() => deletePosts(post.id)}
          >
            Delete post
          </button>
        </div>
      ))}
    </div>
  );
}
