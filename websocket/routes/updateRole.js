const { docClient, doesTeacherExist } = require("../util");

/**
 * User action of changing student/teacher role
 * Imposes 1 teacher limitation so other users must give up teacher controls first
 * @param {*} data
 * @param {*} socket
 */
const updateRole = async (
  { prevRole, newRole, meetingId, userId, name, avatar },
  socket
) => {
  if (newRole === "TEACHER") {
    const teacherQuery = await doesTeacherExist(meetingId);
    const skArr = teacherQuery[0].sk.split("#");
    const teacherId = skArr[skArr.length - 1];

    if (teacherQuery.length && teacherId !== userId) {
      const payload = {
        action: "updateRoleFailed",
        data: {
          prevRole,
          culprit: teacherQuery[0].name,
        },
      };
      try {
        await socket.send(JSON.stringify(payload), socket.id);
      } catch {
        // About to return error anyways
      }
      return { statusCode: 404 };
    }
  }
  const now = new Date().toISOString();
  const pk = `MEETING#${meetingId}`;
  // No transactwrite because user info may exist if user drops off from call
  let UserItem = {
    pk,
    sk: `USER#${newRole}#${meetingId}#${userId}`,
    classId: "null",
    name,
    avatar,
  };
  if (newRole === "STUDENT")
    UserItem = {
      ...UserItem,
      coinTotal: 0,
      gamification: { correctStreak: 0 },
      coinChange: 0,
    };

  const transactParams = [
    {
      Delete: {
        TableName: process.env.db,
        Key: {
          pk,
          sk: `CONN#${prevRole}#${socket.id}`,
        },
      },
    },
    {
      Delete: {
        TableName: process.env.db,
        Key: {
          pk,
          sk: `USER#${prevRole}#${meetingId}#${userId}`,
        },
      },
    },
    {
      Put: {
        TableName: process.env.db,
        Item: UserItem,
      },
    },
    {
      Put: {
        TableName: process.env.db,
        Item: {
          pk,
          sk: `CONN#${newRole}#${socket.id}`,
          user: { id: userId, name },
          connectedAt: now,
        },
      },
    },
  ];

  try {
    await docClient.transactWrite({ TransactItems: transactParams }).promise();
  } catch (error) {
    return {
      statusCode: 404,
      reason: "Error at DB transactWrite",
      error,
    };
  }

  const payload = {
    action: "updateRoleSuccess",
    data: {
      newRole,
    },
  };
  try {
    await socket.send(JSON.stringify(payload), socket.id);
  } catch (error) {
    return { statusCode: 404 };
  }

  return {
    statusCode: 200,
  };
};

module.exports = updateRole;
