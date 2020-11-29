/* eslint-disable no-undef */
const {
  ask,
  disconnect,
  joinClass,
  joinMeeting,
  ping,
  respond,
  setClass,
  getLeaderboard,
} = require("./routes");

const handler = require("./handler");
const { typeCheck } = require("./util/type-check");

const DateType = {
  Date: {
    typeOf: "String",
    validate: (el) => !Number.isNaN(new Date(el).getTime()),
  },
};

const RoleType = {
  Role: {
    typeOf: "String",
    validate: (el) => ["STUDENT", "TEACHER"].includes(el),
  },
};

const JSONableType = {
  JSONable: {
    typeOf: "String",
    validate: (el) =>
      typeCheck(
        "String | Number | Boolean | [String|Number|Boolean] | Null",
        JSON.parse(el)
      ),
  },
};

const schemas = {
  /// TODO: Encode answer index from options, don't compare text itself
  ask: [
    "{teacher: {name: String, id: String}, avatar: String | Null, classId: String, meetingId: String, question: {type: QuestionType, image: String | Null, text: String | Null}, answer: String | Null | Number | [Boolean] | Boolean, meta: {optionNum: Number | Null, options: [String|Number] | Null}, askTimestamp: Date, questionId: String}",
    {
      customTypes: {
        ...DateType,
        ...JSONableType,
        QuestionType: {
          typeOf: "String",
          validate: (el) =>
            ["TrueFalse", "MCQ", "MultiSelect", "ShortAnswer"].includes(el),
        },
      },
    },
  ],
  joinClass: [
    "{userId: String, classId: String, meetingId: String, name: String}",
  ],
  joinMeeting: [
    "{meetingId: String, role: Role, userId: String, name: String, avatar: String}",
    {
      customTypes: { ...RoleType },
    },
  ],
  respond: [
    "{student: {name: String, id: String}, answerCrypt: String | Undefined, avatar: String | Null, questionId: String, meetingId: String, classId: String, response: String | Null | Number | [Boolean] | Boolean, askTimestamp: Date, respondTimestamp: Date}",
    { customTypes: DateType },
  ],
  setClass: ["{classId: String, userId: String, meetingId: String}"],
  ping: ["*"],
  disconnect: [
    "Undefined | {meetingId: String, role: Role, classId: String, userId: String}",
    { customTypes: { ...RoleType } },
  ],
  getLeaderboard: ["{meetingId: String}"],
};

const redirect = {
  ask,
  disconnect,
  joinClass,
  joinMeeting,
  respond,
  setClass,
  ping,
  getLeaderboard,
};

// TODO: Add route for changing roles, checking for teacher surrender role
on("disconnect", async (..._) =>
  handler(..._, redirect.disconnect, ...schemas.disconnect)
);
on("default", async (..._) => handler(..._, redirect.ping, ...schemas.ping));
on("ask", async (..._) => handler(..._, redirect.ask, ...schemas.ask));
on("joinClass", async (..._) =>
  handler(..._, redirect.joinClass, ...schemas.joinClass)
);
on("joinMeeting", async (..._) =>
  handler(..._, redirect.joinMeeting, ...schemas.joinMeeting)
);
on("respond", async (..._) =>
  handler(..._, redirect.respond, ...schemas.respond)
);
on("setClass", async (..._) =>
  handler(..._, redirect.setClass, ...schemas.setClass)
);
on("getLeaderboard", async (..._) =>
  handler(..._, redirect.getLeaderboard, ...schemas.getLeaderboard)
);
