"use client";

import { useState } from "react";

export default function TestPage() {
    const [text, setText] = useState("");

    console.log("TestPage rendered at:", new Date().toISOString());

    return (
        <div style={{ padding: "20px" }}>
            <h1>Simple Test Page</h1>
            <p>If this page refreshes, there's a fundamental Next.js issue.</p>
            <p>Render count should stay low (2-3 in dev mode with React).</p>

            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type here - should not vanish"
                style={{ padding: "10px", fontSize: "16px", width: "300px" }}
            />

            <p>Current value: {text}</p>
            <p>Check browser console for render count</p>
        </div>
    );
}
