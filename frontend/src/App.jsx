import HomePage from "./routes/homePage/homePage";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ListPage from "./routes/listPage/listPage";
import { Layout, RequireAuth } from "./routes/layout/layout";
import SinglePage from "./routes/singlePage/singlePage";
import ProfilePage from "./routes/profilePage/profilePage";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import Listings from "./routes/listings/listings";
import ProfileUpdatePage from "./routes/profileUpdatePage/profileUpdatePage";
import NewPostPage from "./routes/newPostPage/newPostPage";
import { listPageLoader, profilePageLoader, singlePageLoader, listingsPageLoader } from "./lib/loaders";
import UpdatePost from "./routes/updatePost/UpdatePost";
import PaymentDemo from "./routes/paymentDemo/paymentDemo";
import PricingPage from "./routes/pricingPage/pricingPage";


function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />
        },
        {
          path: "/list",
          element: <ListPage />,
          loader: listPageLoader
        },
        {
          path: "/login",
          element: <Login />
        },
        {
          path: "/register",
          element: <Register />
        },
        {
          path: "/payment-demo",
          element: <PaymentDemo />
        },
        {
          path: "/pricing",
          element: <PricingPage />
        },
        {
          path: "/:id",
          element: <SinglePage />,
          loader: singlePageLoader
        }
      ]
    },
    {
      path: "/",
      element: <RequireAuth />,
      children: [
        {
          path: "/profile",
          element: <ProfilePage />,
          loader: profilePageLoader
        },
        {
          path: "/listings",
          element: <Listings />,
          loader: listingsPageLoader
        },
        {
          path: "/profile/update",
          element: <ProfileUpdatePage />
        },
        {
          path: "/add",
          element: <NewPostPage />
        },
        {
          path: "/update/post/:id",
          element: <UpdatePost />
        },
      ]
    }
  ]);

  return (

    <RouterProvider router={router} />
  );
}

export default App;
