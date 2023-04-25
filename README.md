# Edu-pal: Q&A for Google Meet (500k logins)

[Chrome Web Store 🚀](https://chrome.google.com/webstore/detail/edu-pal-learning-feedback/geopbiaefoieahodpfbclhoabkikbnkn) | [Pitch Deck 💡](https://drive.google.com/file/d/1OrvaGk4hP9OD8jZcwqO6skcJlsyEHc6V/view?usp=sharing) | [ProductHunt 👀](https://www.producthunt.com/products/edu-pal#edu-pal)

[![Edu-pal Video Demo](https://img.youtube.com/vi/SO5M4FiOt5M/0.jpg)](https://www.youtube.com/watch?v=SO5M4FiOt5M)

Edu-pal is a viral (500k logins), no-login Chrome Extension designed to make Q&A in online classes fuss-free. Teachers persuade kids to love learning with fun games and friendly competition!

**🚀 Instant Feedback:** Gauge student understanding real-time.

**📝 On-the-Fly Questions:** Adjust teaching based on responses.

**🎮 Engaging Learning:** Games, leaderboards, and avatars.

## Architecture
1. **React App:** Modern, responsive UI/UX, powered by Recoil for state management.
2. **API Gateway:** RESTful API with Lambda, WebSockets for real-time communication, and CloudWatch for logging.
3. **Data Storage:** AWS DynamoDB for fast and flexible NoSQL, secured by IAM policies.
4. **Serverless:** AWS Lambda for cost-effective, scalable event-driven serverless architecture.
5. **Integrations:** Seamless compatibility with Google Meet, no login.
6. **Analytics:** Mixpanel for real-time, data-driven decisions.

## Setup
1. Clone the repository.
2. Run `yarn` to install dependencies.
3. Run `yarn global add sls` to install Serverless globally.
4. Run `yarn deploy` to build and zip the extension.
5. Run serverless deploy to deploy your service to AWS.
6. Once deployed, test your endpoints using a tool like Postman or cURL.

## Why Now
In remote learning, teachers face muted mics and missing feedback, struggling to understand if students truly grasp the concepts. Edu-pal aims to eliminate guesswork by providing real-time assessment, engaging gameplay, and seamless integration with existing tools, making eLearning radically easier for teachers.

## Why Edu-pal
- **🏆 Best Approach:** Combines game-based learning and continuous assessment, removing barriers in remote education.
- **🌏 Asia-Pacific Focus:** Targeting a region underserved by competitors.
- **🤝 Strong Partnerships:** Collaborations with SG Code Campus and Stalford Learning Centre.
- **🚀 Traction:** $3000 in grants, 6000 MAUs at peak, 500k logins without paid advertising.
- **💰 Market Growth:** eLearning sector valued at $171 billion in 2020, with a 12% growth rate.

License: **MIT**

Dedicated to my Edu-pal [team](https://drive.google.com/file/d/1OrvaGk4hP9OD8jZcwqO6skcJlsyEHc6V/view?usp=sharing)!