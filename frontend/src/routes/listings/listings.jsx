import { Suspense } from "react"
import { Link, useLoaderData, Await } from "react-router-dom"
import List from "../../components/list/List";


import Button from "../../components/ui/button";

import "./listings.scss";

export default function Listings() {
    const data = useLoaderData();
    return <>
        <div className="title">
            <h1>My List</h1>
            <Button to="/add">Add New Post</Button>
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