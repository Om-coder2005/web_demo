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
  const setCookie = res.headers.get("set-cookie");
  console.log("Set-Cookie header:", setCookie);
  return { res, data, setCookie };
}

async function testAuthenticatedEndpoint(cookie) {
  const res = await fetch("http://localhost:3000/api/outlets/me", {
    method: "GET",
    headers: { "Cookie": cookie },
  });
  const data = await res.json();
  console.log("/api/outlets/me response:", { status: res.status, data });
  return { res, data };
}

async function testAnalytics(cookie) {
  const res = await fetch("http://localhost:3000/api/analytics/summary", {
    method: "GET",
    headers: { "Cookie": cookie },
  });
  const data = await res.json();
  console.log("/api/analytics/summary response:", { status: res.status, data });
  return { res, data };
}

// Main
sendOtp()
  .then(({ data }) => {
    const otp = data.devOtp;
    if (!otp) throw new Error("No devOtp in response");
    return verifyOtp(otp);
  })
  .then(({ setCookie }) => {
    if (!setCookie) throw new Error("No Set-Cookie header");
    const cookie = setCookie;
    return Promise.all([
      testAuthenticatedEndpoint(cookie),
      testAnalytics(cookie)
    ]).then(([outletsResult, analyticsResult]) => {
      console.log("\n=== Outlets/me Data ===");
      console.log(JSON.stringify(outletsResult.data, null, 2));
      console.log("\n=== Analytics Data ===");
      console.log(JSON.stringify(analyticsResult.data, null, 2));
    });
  })
  .catch(console.error);