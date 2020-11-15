const {
  ask,
  disconnect,
  joinClass,
  joinMeeting,
  ping,
  respond,
  setClass,
} = require("./routes");
const { typed } = require("./util");
const { typeCheck } = require("./util/type-check/lib");

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

// eslint-disable-next-line no-undef
on("ask", async (data, socket) => {
  typed(
    "{teacher: {name: String, id: String}, avatar: String | Null, classId: String | Null, meetingId: String, question: {type: Enum, image: String | Null, text: String | Null}, answer: JSONCustom, meta: {optionNum: Int | Null, options: [String|Int] | Null}, askTimestamp: Date, questionId: String",
    data,
    {
      customTypes: {
        ...DateType,
        Enum: {
          typeOf: "String",
          validate: (el) =>
            ["True/False", "MCQ", "Option", "Short Answer"].includes(el),
        },
        JSONCustom: {
          typeOf: "String",
          validate: (el) =>
            typeCheck(
              "String | Number | [String|Number] | null",
              JSON.parse(el)
            ),
        },
      },
    }
  );
  await ask(data, socket);
});

// eslint-disable-next-line no-undef
on("disconnect", async (data, socket) => {
  typed(
    "Undefined | {meetingId: String, role: Role, classId: String | Null, userId: String}",
    data,
    { customTypes: { ...RoleType } }
  );
  await disconnect(data, socket);
});

// eslint-disable-next-line no-undef
on("joinClass", async (data, socket) => {
  typed(
    "{userId: String, classId: String, meetingId: String, name: String}",
    data
  );
  await joinClass(data, socket);
});

// eslint-disable-next-line no-undef
on("joinMeeting", async (data, socket) => {
  typed("{meetingId: String, role: Role, userId: String, name: String}", data, {
    customTypes: { ...RoleType },
  });
  await joinMeeting(data, socket);
});

// eslint-disable-next-line no-undef
on("default", async (data, socket) => {
  typed("undefined", data);
  await ping(data, socket);
});

// eslint-disable-next-line no-undef
on("respond", async (data, socket) => {
  typed(
    // Custom date
    "{student: {name : String, id: String}, answerCrypt: String, avatar: String | Null, questionId: String, meetingId: String, classId: String, response: String, askTimestamp: Date, respondTimestamp: Date",
    data,
    { customTypes: DateType }
  );
  await respond(data, socket);
});

// eslint-disable-next-line no-undef
on("setClass", async (data, socket) => {
  typed("{classId: String, userId: String, meetingId: String}", data);
  await setClass(data, socket);
});
