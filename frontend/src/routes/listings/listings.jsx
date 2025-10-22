import { Suspense } from "react"
import { Link, useLoaderData, Await } from "react-router-dom"
import List from "../../components/list/List";

import "./listings.scss";

export default function Listings() {
    const data = useLoaderData();
    return <>
        <div className="title">
            <h1>My List</h1>
            <Link to="/add">
                <button>Add New Post</button>
            </Link>
        </div>

        <Suspense fallback={<p>Loading...</p>}>
            <Await
                resolve={data.postResponse}
                errorElement={<p>Error Loading Posts...</p>}
            >
                {(postResponse) => <List posts={postResponse.data.userPosts} />}
            </Await>

        </Suspense>
    </>
}