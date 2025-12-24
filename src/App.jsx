import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "@/Layout.jsx";
import Home from "@/pages/Home.jsx";
import CreateListing from "@/pages/CreateListing.jsx";
import ListingDetails from "@/pages/ListingDetails.jsx";
import MyListings from "@/pages/MyListings.jsx";
import Messages from "@/pages/Messages.jsx";
import Conversation from "@/pages/Conversation.jsx";
import Login from "@/pages/Login.jsx";
import Signup from "@/pages/Signup.jsx";
import VerifyEmail from "@/pages/VerifyEmail.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sell" element={<CreateListing />} />
        <Route path="/listing" element={<ListingDetails />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Layout>
  );
}


