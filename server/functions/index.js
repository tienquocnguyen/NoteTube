const db = require('./util/admin');
const functions = require('firebase-functions');
const app = require('express')();
const { login, signup, auth } = require('./handlers/users');
const { search, onNoteCreated, unindexNotes } = require('./handlers/documents');
const cors = require('cors');
app.use(cors());

app.post('/login', login);
app.post('/signup', signup);

const algoliasearch = require('algoliasearch');
const ALGOLIA_ID = functions.config().algolia.appid;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.apikey;

const ALGOLIA_INDEX_NAME = 'notes';
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

// Update the search index every time a blog post is written.
exports.onNoteCreated = functions.firestore
	.document('notes/{noteId}')
	.onCreate((snap) => {
		// Get the note document
		const note = snap.data();

		// Add an 'objectID' field which Algolia requires
		note.objectID = snap.id;

		// Write to the algolia index
		const index = client.initIndex(ALGOLIA_INDEX_NAME);
		return index.saveObject(note);
	});
exports.updateIndex = functions.firestore
	.document('notes/{noteId')
	.onUpdate((change) => {
		const newData = change.after.data();
		const objectID = change.after.id;
		return index.saveObject({ ...newData, objectID });
	});
exports.unindexNotes = functions.firestore
	.document('notes/{noteId}')
	.onDelete((snap, context) => {
		const objectId = snap.id;
		return index.deleteObject(objectId);
	});

exports.api = functions.https.onRequest(app);
