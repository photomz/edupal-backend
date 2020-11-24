/* eslint-disable no-undef */
const {
  ask,
  disconnect,
  joinClass,
  joinMeeting,
  ping,
  respond,
  setClass,
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

const schemas = {
  /// TODO: Encode answer index from options, don't compare text itself
  ask: [
    "{teacher: {name: String, id: String}, avatar: String | Null, classId: String, meetingId: String, question: {type: Enum, image: String | Null, text: String | Null}, answer: JSONCustom, meta: {optionNum: Number | Null, options: [String|Number] | Null}, askTimestamp: Date, questionId: String}",
    {
      customTypes: {
        ...DateType,
        Enum: {
          typeOf: "String",
          validate: (el) =>
            ["TrueFalse", "MCQ", "MultiSelect", "ShortAnswer"].includes(el),
        },
        JSONCustom: {
          typeOf: "String",
          validate: (el) =>
            typeCheck(
              "String | Number | [String|Number] | Null",
              JSON.parse(el)
            ),
        },
      },
    },
  ],
  joinClass: [
    "{userId: String, classId: String, meetingId: String, name: String}",
  ],
  joinMeeting: [
    "{meetingId: String, role: Role, userId: String, name: String}",
    {
      customTypes: { ...RoleType },
    },
  ],
  respond: [
    "{student: {name : String, id: String}, answerCrypt: String, avatar: String | Null, questionId: String, meetingId: String, classId: String, response: String, askTimestamp: Date, respondTimestamp: Date}",
    { customTypes: DateType },
  ],
  setClass: ["{classId: String, userId: String, meetingId: String}"],
  ping: ["*"],
  disconnect: [
    "* | {meetingId: String, role: Role, classId: String, userId: String}",
    { customTypes: { ...RoleType } },
  ],
};

const redirect = {
  ask,
  disconnect,
  joinClass,
  joinMeeting,
  respond,
  setClass,
  ping,
};

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
