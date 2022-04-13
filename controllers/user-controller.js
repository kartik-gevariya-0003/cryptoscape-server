const crypto = require('crypto');
const dbConnection = require("../database/database-connection");
const {validationResult} = require('express-validator');
const {generateToken} = require("../utils/token-utils");

const register = async (request, response, callback) => {
  const errors = validationResult(request);

  if (!errors.isEmpty()) {
    return response.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const postData = request.body;

  const md5sum = crypto.createHash('md5');

  const userQuery = "select * from user where email = ?";
  dbConnection.query(userQuery, [postData.email], function (err, user) {
    if (user && user.length > 0) {
      return response.status(412).json({
        success: false,
        message: "Email already exists in system."
      });
    } else {
      const registerQuery = "INSERT into user(first_name, last_name, email, password) values(?,?,?,?)";
      const registerQueryData = [postData.firstName, postData.lastName, postData.email, md5sum.update(postData.password).digest('hex')];
      dbConnection.query(registerQuery, registerQueryData, function (error, result) {
        if (error) {
          throw error
        }

        return response.status(200).json({
          message: "User registered successfully.",
          success: true
        });
      });
    }
  });
}

const login = async (request, response, callback) => {
  const errors = validationResult(request);

  if (!errors.isEmpty()) {
    return response.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const postData = request.body;

  const getUserDataQuery = " SELECT id, email, password from user where email = ?";
  dbConnection.query(getUserDataQuery, [postData.email], async function (error, result) {
    if (error) {
      throw error
    }

    if (result && result.length > 0) {
        let user = JSON.parse(JSON.stringify(result))[0];
        console.log(user);
        const md5sum = crypto.createHash('md5');
        let passwordHash = md5sum.update(postData.password).digest('hex');
        if (user.password === passwordHash) {
            let token = await generateToken(user);
            return response.status(200).json({
                success: true,
                message: "User logged in successfully.",
                user: {
                    email: user.email,
                    token: token
                }
            });
        } else {
          return response.status(401).json({
            success: false,
            message: "Invalid username or password."
          });
        }
    } else {
        return response.status(401).json({
            success: false,
            message: "Invalid username or password."
        });
    }
  });
}

module.exports = {login, register};
