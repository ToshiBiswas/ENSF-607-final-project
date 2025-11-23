import React from "react";
import Logo from "../components/Logo";
import "./About.css";

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-header">
          <Logo variant="green-logotype" height={60} clickable={true} />
          <h1 className="about-title">About MindPlanner</h1>
          <p className="about-subtitle">
            Your all-in-one event planning and management platform
          </p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              MindPlanner is designed to make event planning simple, efficient,
              and enjoyable. Whether you're organizing a small gathering or a
              large conference, we provide the tools you need to succeed.
            </p>
          </section>

          <section className="about-section">
            <h2>Features</h2>
            <ul className="about-features">
              <li>
                <strong>Event Management:</strong> Create, edit, and manage
                your events with ease
              </li>
              <li>
                <strong>Ticket Sales:</strong> Set up multiple ticket types and
                track sales in real-time
              </li>
              <li>
                <strong>Attendee Tracking:</strong> Keep track of who's coming
                to your events
              </li>
              <li>
                <strong>Notifications:</strong> Send updates and reminders to
                your attendees
              </li>
              <li>
                <strong>Payment Processing:</strong> Secure payment handling
                for ticket purchases
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Get Started</h2>
            <p>
              Ready to plan your next event?{" "}
              <a href="/register" className="about-link">
                Sign up
              </a>{" "}
              for a free account or{" "}
              <a href="/login" className="about-link">
                sign in
              </a>{" "}
              if you already have one.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;

