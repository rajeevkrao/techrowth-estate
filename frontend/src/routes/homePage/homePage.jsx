import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../../components/searchBar/SearchBar";
import "./homePage.scss";
import { AuthContext } from "../../context/AuthContext";

import Button from "../../components/ui/button"

function HomePage() {

  const navigate = useNavigate();

  const { currentUser } = useContext(AuthContext);

  console.log(currentUser);

  return (
    <div className="homePage">
      <div className="textContainer">
        <div className="wrapper">
          <h1 className="title">Find Real Estate & Get Your Dream Place</h1>
          <p>
            Discover your perfect home with ease. Browse thousands of properties, connect directly with sellers, and find the place you've been dreaming of. Start your journey to homeownership today.
          </p>
          <SearchBar />
          <div class="property-owner">
            <div class="text">Are you a property owner?</div>
            <Button onClick={()=> navigate("/listings")}>Post Free Property Ad</Button>
          </div>
          <div className="boxes">
            <div className="box">
              <h1>2+</h1>
              <h2>Years of Experience</h2>
            </div>
            <div className="box">
              <h1>10</h1>
              <h2>Award Gained</h2>
            </div>
            <div className="box">
              <h1>150+</h1>
              <h2>Property Ready</h2>
            </div>
          </div>
        </div>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default HomePage;
