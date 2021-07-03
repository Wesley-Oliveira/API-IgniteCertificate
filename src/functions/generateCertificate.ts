import chromium from "chrome-aws-lambda";
import path from "path";
import handlebars from "handlebars";
import fs from "fs";
import dayjs from "dayjs";

import { document } from "../utils/dynamodbClient";

interface ICreateCertificate {
    id: string;
    name: string;
    grade: string;
}

interface ITemplate {
    id: string;
    name: string;
    grade: string;
    date: string;
    medal: string;
};

const compile = async function( data: ITemplate ) {
    const filePath = path.join(process.cwd(), "src", "templates", "certificate.hbs");
    const html = fs.readFileSync(filePath, "utf-8");
    return handlebars.compile(html)(data);
}

export const handle = async (event) => {
    const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

    // Insert on db
    await document.put({
        TableName: "users_certificates",
        Item: {
            id,
            name,
            grade,
        }
    }).promise();

    const medalPath = path.join(process.cwd(), "src", "templates", "selo.png");
    const medal = fs.readFileSync(medalPath, "base64");

    const data: ITemplate {
        date: dayjs().format("DD//MM/YYYY"),
        grade,
        name,
        id,
        medal
    }

    // Generate certificate
    // Compiling using handlebars -> Transform on PDF -> Save on S3
    const content = await compile(data);

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: "Certificate created!",
        }),
        headers: {
            "Content-type": "application/json"
        },
    };
};