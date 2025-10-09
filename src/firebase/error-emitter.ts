import { EventEmitter } from "events";

// This is a simple event emitter that we'll use to communicate errors
// between our Firestore queries and a central listener component.
export const errorEmitter = new EventEmitter();
