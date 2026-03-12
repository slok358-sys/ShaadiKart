const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Define a secret for the email password
// Run `firebase functions:secrets:set EMAIL_PASSWORD` to set this.
const emailPassword = defineSecret('EMAIL_PASSWORD');

// ==========================================
// EMAIL CONFIGURATION
// ==========================================
/**
 * @param {string} password - The email password (ideally from secrets)
 */
const createTransporter = (password) => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'YOUR_EMAIL@gmail.com',
        pass: password || 'YOUR_APP_PASSWORD' 
    }
});

exports.sendOrderEmail = onDocumentCreated({
    document: "bookings/{bookingId}",
    secrets: [emailPassword]
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const data = snapshot.data();
    const customerName = data.customerName;
    const customerEmail = data.customerEmail;
    const total = data.total;
    const items = data.items || [];

    const itemsHtml = items.map(item => `<li>${item.title} - ₹${item.price.toLocaleString()}</li>`).join("");

    const mailOptions = {
        from: '"ShaadiKart Orders" <YOUR_EMAIL@gmail.com>',
        to: 'YOUR_EMAIL@gmail.com', // SEND TO YOURSELF
        subject: `New Order Received from ${customerName}!`,
        html: `
            <h1>New Booking Details</h1>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
            <h3>Items:</h3>
            <ul>${itemsHtml}</ul>
            <p>Please check your Admin Dashboard for more details.</p>
        `
    };

    const transporter = createTransporter(emailPassword.value());

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully for booking ${event.params.bookingId}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
});
