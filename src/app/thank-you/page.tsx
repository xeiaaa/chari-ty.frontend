import NameScroller from "@/components/common/name-scroller";
import React from "react";

const ThankYouPage = () => {
  const donations = [
    { name: "Dee Mid", amount: 40 },
    { name: "Bret Axl Sebastian Pura", amount: 5 },
    { name: "Marie Elaine Jose", amount: 8 },
    { name: "Issabella", amount: 102 },
    { name: "Recca Hanabishi", amount: 3 },
    { name: "Max Domon", amount: 15 },
    { name: "Aira Kirisawa", amount: 12 },
    { name: "Kaoru Koganei", amount: 7 },
    { name: "Kurei", amount: 20 },
    { name: "Anonymous #1", amount: 18 },
    { name: "Kurenai", amount: 2 },
    { name: "Anonymous #2", amount: 6 },
    { name: "Kage Hoshi", amount: 14 },
    { name: "Yuusuke Urameshi", amount: 9 },
    { name: "Hiei", amount: 4 },
    { name: "Tidus", amount: 12 },
    { name: "Yuna", amount: 23 },
    { name: "Rikku", amount: 40 },
    { name: "Cloud Strife", amount: 21 },
    { name: "Tifa Lockhart", amount: 11 },
    { name: "Aerith Gainsborough", amount: 14 },
    { name: "Sephiroth", amount: 11 },
    { name: "Zack Fair", amount: 32 },
    { name: "Tidus", amount: 57 },
    { name: "Yuna", amount: 11 },
    { name: "Rikku", amount: 11 },
  ];

  return (
    <div className="relative">
      <NameScroller donations={donations} canvasStyle={{}} />
    </div>
  );
};

export default ThankYouPage;
