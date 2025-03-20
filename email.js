import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 1025,
    secure: false,
});
export async function sendRequestStatusEmail(user, request) {
    const subject = `Request Status Update: ${request.status.toUpperCase()}`;
    const html = `
    <h1>Your request has been ${request.status}</h1>
    <p>Request details:</p>
    <ul>
      <li>Type: ${request.type}</li>
      <li>Start Date: ${request.startDate}</li>
      <li>End Date: ${request.endDate}</li>
    </ul>
    ${request.rejectionReason ? `<p>Reason: ${request.rejectionReason}</p>` : ""}
  `;
    try {
        await transporter.sendMail({
            from: "noreply@sisaf.com",
            to: user.email,
            subject,
            html,
        });
    }
    catch (error) {
        console.error("Failed to send email:", error);
    }
}
//# sourceMappingURL=email.js.map