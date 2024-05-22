import { useState, useEffect } from "react";
import "./../../configureAmplify";
import Link from "next/link";
import { Auth, Hub } from "aws-amplify";

const NavBar = () => {
  const [signedUser, setSignedUser] = useState(false);

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
      setSignedUser(true);
    } catch (error) {}
  }

  return (
    <nav className="flex justify-center pt-3 pb-3 space-x-4 border-b bg-cyan-500 border-gray-300">
      {[
        ["Home", "/"],
        ["Create post", "/create-post"],
        ["Profile", "/profile"],
      ].map(([title, url], index) => (
        <Link href={url} key={index}>
          <p className="rounded-lg px-3 py-2 text-slate-700 fozt-medium hover:bg-slage-100 hover:text-slate-900">
            {" "}
            {title}
          </p>
        </Link>
      ))}

      {signedUser && (
        <Link href="/my-posts">
          <p className="rounded-lg px-3 py-2 text-slate-700 font-medium hover:bg-slage-100 hover:text-slate-900">
            My Posts
          </p>
        </Link>
      )}
    </nav>
  );
};

export default NavBar;
