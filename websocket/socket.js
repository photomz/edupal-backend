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

const DateType = {
  Date: {
    typeOf: "String",
    validate: (el) => !Number.isNaN(new Date(el).getTime()),
  },
};

// eslint-disable-next-line no-undef
on("ask", async (data, socket) => {
  typed(
    "{teacher: {name: String, id: String}, avatar: String | Null, classId: String | Null, meetingId: String, question: {type: Enum, image: String | Null, text: String | Null}, meta: {answer: String | [String] | Null, optionNum: Int | Null, options: [String|Int] | Null}, askTimestamp: Date, questionId: String",
    data,
    {
      customTypes: {
        ...DateType,
        Enum: {
          typeOf: "String",
          validate: (el) =>
            ["True/False", "MCQ", "Option", "Short Answer"].includes(el),
        },
      },
    }
  );
  await ask(data, socket);
});

// eslint-disable-next-line no-undef
on("disconnect", async (data, socket) => {
  typed(
    "Undefined | {meetingId: String, connectionId: String, classId: String | Null, studentId: String}",
    data
  );
  await disconnect(data, socket);
});

// eslint-disable-next-line no-undef
on("joinClass", async (data, socket) => {
  typed("{userId: String, classId: String, meetingId: String}", data);
  await joinClass(data, socket);
});

// eslint-disable-next-line no-undef
on("joinMeeting", async (data, socket) => {
  const custom = {
    customTypes: {
      Enum: {
        typeOf: "String",
        validate: (el) => ["STUDENT", "TEACHER"].includes(el),
      },
    },
  };
  typed("{meetingId: String, role: Enum, userId: String}", data, custom);
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
    "{student: {name : String, id: String}, avatar: String | Null, questionId: String, meetingId: String, classId: String, response: String, askTimestamp: Date, respondTimestamp: Date",
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
