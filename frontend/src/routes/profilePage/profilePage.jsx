import { Suspense, useContext, useEffect, useState } from "react";
import { Await, Link, useLoaderData, useNavigate } from "react-router-dom";
import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import apiRequest from "../../lib/apiRequest";
import "./profilePage.scss";
import { AuthContext } from "../../context/AuthContext";
import Button from "../../components/ui/button";

function ProfilePage() {
  const data = useLoaderData();
  const { updateUser, currentUser } = useContext(AuthContext);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await apiRequest.get('/users/credits');
        setCredits(res.data.credits);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest.post('/auth/logout');
      updateUser(null); // Clear user in the AuthContext.
      navigate('/');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          <div className="title">
            <h1>User Information</h1>
            <div className="buttons">
              <Button to="/profile/update">Update Profile</Button>
              <Button to="/listings">My Listings</Button>
            </div>
          </div>

          {/* Credits Display */}
          <div className="creditsSection">
            <div className="creditsCard">
              <div className="creditsIcon">💳</div>
              <div className="creditsInfo">
                <h3>Available Credits</h3>
                <div className="creditsAmount">
                  {loading ? '...' : credits}
                </div>
                <p>1 Credit = 1 Property Listing</p>
              </div>
              <Button to="/pricing">Buy Credits</Button>
            </div>
            {credits < 3 && !loading && (
              <div className="lowCreditsWarning">
                ⚠️ Low credits! Purchase more to continue listing properties.
              </div>
            )}
          </div>

          <div className="info">
            <span>
              Avatar:
              <img
                src={currentUser.avatar || "/noavatar.jpg"}
                alt=""
              />
            </span>
            <span>
              Username: <b>{currentUser.username}</b>
            </span>
            <span>
              E-mail: <b>{currentUser.email}</b>
            </span>
            <button onClick={handleLogout}>Logout</button>
          </div>

          <div className="title">
            <h1>Saved List</h1>
          </div>

          <Suspense fallback={<p>Loading...</p>}>
            <Await
              resolve={data.postResponse}
              errorElement={<p>Error Loading Posts...</p>}
            >
              {(postResponse) => <List posts={postResponse.data.savedPosts} />}
            </Await>
          </Suspense>

        </div>
      </div>
      <div className="chatContainer">
        <div className="wrapper">

          <Suspense fallback={<p>Loading...</p>}>
            <Await
              resolve={data.chatResponse}
              errorElement={<p>Error Loading Chats...</p>}
            >
              {(chatResponse) => <Chat chats={chatResponse.data} />}
            </Await>
          </Suspense>


        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
