import express from 'express';
import payload from 'payload';

require('dotenv').config();
const app = express();

const start = async () => {
	// Initialize Payload
	await payload.init({
		secret: process.env.PAYLOAD_SECRET,
		mongoURL: process.env.MONGODB_URI,
		express: app,
		onInit: async () => {
			payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
		},
	});

	app.listen(process.env.PORT);
};

start();
