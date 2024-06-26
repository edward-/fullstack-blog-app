import { useState, useEffect } from "react";
import { Auth, Hub, API, Storage } from "aws-amplify";
import { useRouter } from "next/router";
import MarkDown from "react-markdown";
import "./../../configureAmplify";
import { listPosts, getPost } from "../../graphql/queries";
import { createComment } from "../../graphql/mutations";
import { v4 as uuid } from "uuid";
import dynamic from "next/dynamic";
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

//import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

const initialState = { message: "" };

export default function Post({ post }) {
  const [signedInUser, setSignedInUser] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [comment, setComment] = useState(initialState);
  const [showMe, setShowMe] = useState(false);
  const router = useRouter();
  const { message } = comment;

  function toggle() {
    setShowMe(!showMe);
  }

  useEffect(() => {
    authListener();
  }, []);

  async function authListener() {
    Hub.listen("auth", (data) => {
      switch (data.payload.event) {
        case "signIn":
          return setSignedUser(true);
        case "signOut":
          return setSignedUser(false);
      }
    });

    try {
      await Auth.currentAuthenticatedUser();
      setSignedInUser(true);
    } catch (error) {}
  }

  useEffect(() => {
    async function updateCoverImage() {
      if (post.coverImage) {
        const imageKey = await Storage.get(post.coverImage);
        setCoverImage(imageKey);
      }
    }

    updateCoverImage();
  }, []);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  async function createTheComment() {
    if (!message) return;
    const id = uuid();
    comment.id = id;
    try {
      await API.graphql({
        query: createComment,
        variables: { input: comment },
        authMode: "AMAZON_COGNITO_USER_POOLS",
      });
    } catch (error) {
      console.log(error);
    }

    router.push("/my-posts");
  }

  return (
    <div>
      <h1 className="text-5xl mt-4 font-semibold tracing-wide">{post.title}</h1>
      {coverImage && <img src={coverImage} className="mt-4" alt="post image" />}

      <p className="text-sm front-light my-4">By {post.username}</p>
      <div className="mt-8">
        <MarkDown>{post.content}</MarkDown>
      </div>
      <div>
        {signedInUser && (
          <button
            type="button"
            className="mb-4 bg-green-600 text-while font-semibold px-8 py-2 rounded-lg"
            onClick={toggle}
          >
            Write a Comment
          </button>
        )}

        {
          <div style={{ display: showMe ? "block" : "none" }}>
            <SimpleMDE
              value={comment.message}
              onChange={(value) =>
                setComment({ ...comment, message: value, postID: post.id })
              }
            />
            <button
              onClick={createTheComment}
              type="button"
              className="mb-4 bg-blue-600 text-while font-semibold px-8 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        }
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const postData = await API.graphql({
    query: listPosts,
  });

  const paths = postData.data.listPosts.items.map((post) => ({
    params: {
      id: post.id,
    },
  }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { id } = params;
  const postData = await API.graphql({
    query: getPost,
    variables: { id },
  });

  return {
    props: {
      post: postData.data.getPost,
    },
    revalidate: 1,
  };
}
