import { Webhook } from "svix";
import User from "@/models/User";
import connectDB from "@/config/db";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req){
    const wh = new Webhook(process.env.SIGNING_SECRET)
    const headerPayload = await headers()
    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id"),
        "svix-timestamp": headerPayload.get("svix-timestamp"),
        "svix-signature": headerPayload.get("svix-signature"),
    };
    
    // Get the Payload to Verify
    
    const payload = await req.json();
    const body = JSON.stringify(payload);
    const {data,type} =wh.verify(body,svixHeaders)

    //Prepare the UserDATA tp be saved in the DB
    
    const email = Array.isArray(data.email_addresses) && data.email_addresses.length > 0
  ? data.email_addresses[0].email_address
  : null;

    const UserData = {
        _id: data.id,
        email: email,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
    };

    await connectDB();

    switch (type) {
        case 'user.created':
            await User.create(UserData)
            break;

        case 'user.updated':
            await User.findByIdAndUpdate(data.id,UserData)
            break;

        case 'user.deleted':
            await User.findByIdAndDelete(data.id)
            break;
    
        default:
            break;
    }

    return NextRequest.json({message:"Event Received"})

}

