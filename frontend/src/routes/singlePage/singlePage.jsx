import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import { useLoaderData, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext, useState } from "react";
import {AuthContext} from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";

function SinglePage() {
  const post = useLoaderData();

  const [saved, setSaved] = useState(post.isSaved);
  const { currentUser } = useContext(AuthContext);
  console.log(currentUser);
  console.log(currentUser.id)
  console.log(post)
  console.log(post.user.id)
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/login");
    }
    // AFTER REACT 19 UPDATE TO USEOPTIMISTIK HOOK
    setSaved((prev) => !prev);
    try {
      await apiRequest.post("/users/save", { postId: post.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };


  const handleDelete = async () => {
    const confirmation = window.confirm("Are you sure you want to delete this post?");
    if (!confirmation) return;

    try {
      await apiRequest.delete(`/posts/${post.id}`);
      alert("Post deleted successfully!");
      navigate("/profile"); 
    } catch (err) {
      console.error(err);
      alert("Failed to delete the post. Please try again.");
    }
  }

  const handleEdit = () => {
    navigate(`/update/post/${post.id}`);
  };


  return (
    <div className="singlePage">
      <div className="details">
        <div className="wrapper">
          <Slider images={post.images} />
          <div className="info">
            <div className="top">
              <div className="post">
                <h1>{post.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>{post.address}</span>
                </div>
                <div className="price">$ {post.price}</div>
              </div>
              <div className="user">
                <img src={post.user.avatar} alt="" />
                <span>{post.user.username}</span>
              </div>
            </div>
            <div
              className="bottom"
              dangerouslySetInnerHTML={{
                __html: post.postDetail ? DOMPurify.sanitize(post.postDetail.desc) : ""
              }}
            ></div>
          </div>

          {currentUser && currentUser.id === post.userId && (
            <div className="postActions">
              <button className="edit" onClick={handleEdit}>
                Edit
              </button>
              <button className="delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )} 


        </div>
      </div>
      <div className="features">
        <div className="wrapper">
          <p className="title">General</p>
          <div className="listVertical">
            <div className="feature">
              <img src="/utility.png" alt="" />
              <div className="featureText">
                <span>Utilities</span>
                  {post.postDetail && post.postDetail.utilities === "owner" ? (
                     <p>Owner is Responsible</p>
                  ): (
                    <p>Renter is Responsible</p>
                  )}
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Pet Policy</span>
                {post.postDetail && post.postDetail.petPolicy === "allowed" ? <p>Pets Allowed</p> : <p>Pets Not Allowed</p>}
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Income Policy</span>
                <p>{post.postDetail && post.postDetail.income}</p>
              </div>
            </div>
          </div>
          <p className="title">Sizes</p>
          <div className="sizes">
            <div className="size">
              <img src="/size.png" alt="" />
              <span>{post.postDetail && post.postDetail.size} sqft</span>
            </div>
            <div className="size">
              <img src="/bed.png" alt="" />
              <span>{post.postDetail && post.bedroom} Bed</span>
            </div>
            <div className="size">
              <img src="/bath.png" alt="" />
              <span>{post.postDetail && post.bathroom} Bathroom</span>
            </div>
          </div>
          <p className="title">Nearby Places</p>
          <div className="listHorizontal">
            <div className="feature">
              <img src="/school.png" alt="" />
              <div className="featureText">
                <span>School</span>
                {post.postDetail && post.postDetail.school && (
                  <p>
                    {post.postDetail.school > 999
                      ? post.postDetail.school / 1000 + " km"
                      : post.postDetail.school + " m"}{" "}
                    away
                  </p>
                )}
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Bus Stop</span>
                {post.postDetail && post.postDetail.bus && (
                  <p>
                    {post.postDetail.bus > 999
                      ? post.postDetail.bus / 1000 + " km"
                      : post.postDetail.bus + " m"}{" "}
                    away
                  </p>
                )}
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Restaurant</span>
                {post.postDetail && post.postDetail.restaurant && (
                  <p>
                    {post.postDetail.restaurant > 999
                      ? post.postDetail.restaurant / 1000 + " km"
                      : post.postDetail.restaurant + " m"}{" "}
                    away
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="title">Location</p>
          <div className="mapContainer">
            <Map items={[post]} />
          </div>
          <div className="buttons">
            <button>
              <img src="/chat.png" alt="" />
              Send a Message
            </button>
            <button onClick={handleSave} style={{backgroundColor: saved ? "#93C572" : "white"}}>
              <img src="/save.png" alt="" />
               {saved ? "Place Saved" : "Save the Place"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
