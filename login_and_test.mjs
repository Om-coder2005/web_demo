const email = "sairajpatil0204@gmail.com";

async function sendOtp() {
  const res = await fetch("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  console.log("Send OTP response:", data);
  return { res, data };
}

async function verifyOtp(otp) {
  const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  console.log("Verify OTP response:", data);
  // Extract cookies from the response headers
  const setCookie = res.headers.get("set-cookie");
  console.log("Set-Cookie header:", setCookie);
  return { res, data, setCookie };
}

async function testAuthenticatedEndpoint(cookie) {
  const res = await fetch("http://localhost:3000/api/outlets/me", {
    method: "GET",
    headers: {
      "Cookie": cookie,
    },
  });
  const data = await res.json();
  console.log("/api/outlets/me response:", { status: res.status, data });
  return { res, data };
}

async function testAnalytics(cookie) {
  const res = await fetch("http://localhost:3000/api/analytics/summary", {
    method: "GET",
    headers: {
      "Cookie": cookie,
    },
  });
  const data = await res.json();
  console.log("/api/analytics/summary response:", { status: res.status, data });
  return { res, data };
}

// Main
sendOtp()
  .then(({ data }) => {
    // In development, the OTP is returned in the response as devOtp
    const otp = data.devOtp;
    if (!otp) {
      throw new Error("No devOtp in response; cannot proceed automatically");
    }
    return verifyOtp(otp);
  })
  .then(({ setCookie }) => {
    if (!setCookie) {
      throw new Error("No Set-Cookie header in verify OTP response");
    }
    // The setCookie string might contain multiple cookies; we take the first one or the one we need.
    // For simplicity, we'll use the whole string.
    return testAuthenticatedEndpoint(setCookie);
  })
  .then(({ data }) => {
    console.log("Outlets/me data:", data);
    // Now test analytics
    // We need to reuse the cookie; but we don't have it anymore. Let's adjust.
    // We'll refactor to keep the cookie.
  })
  .catch(console.error);