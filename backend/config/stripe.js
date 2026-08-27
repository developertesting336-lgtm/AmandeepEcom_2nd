import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// console.log(process.env.STRIPE_SECRET_KEY)

export default stripe