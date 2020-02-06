import { Injectable } from "@nestjs/common";
import fetch from "node-fetch";
import * as FormData from "form-data";

@Injectable()
export class CouponService {
  async getCoupon(id) {
    try {
      const form = new FormData();
      form.append(
        "query",
        "SELECT * FROM cpnc_DealCoupon  where redemptionCode = " + id
      );
      // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
      // console.log(form);
      const result = await fetch("https://megusta.do/reports/queries", {
        headers: form.getHeaders(),
        method: "POST",
        body: form
      });
      const response = await result.json();
      return response[0];
    } catch (e) {
      console.log(e);
    }
  }
  async getDeal(id) {
    const form = new FormData();
    //11571

    form.append(
      "query",
      "SELECT * FROM cpnc_Deal INNER JOIN cpnc_DealI18N ON cpnc_Deal.id = cpnc_DealI18N.dealId WHERE cpnc_Deal.id = " +
        id +
        " AND cpnc_DealI18N.name='name'"
    );
    // form.append('query', 'SELECT * FROM cpnc_Deal  WHERE id = '+ id );
    // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
    const result = await fetch("https://megusta.do/reports/queries", {
      headers: form.getHeaders(),
      method: "POST",
      body: form
    });
    const response = await result.json();
    console.log(response);
    return response[0];
  }
  async redeemCoupon(id) {
    const form = new FormData();
    form.append("query", "UPDATE cpnc_DealCoupon SET status=2 WHERE id=" + id);
    console.log(id);
    // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
    const result = await fetch("https://megusta.do/reports/queries/action", {
      headers: form.getHeaders(),
      method: "POST",
      body: form
    });
    const response = await result.json();
    // if(response&&response.updated){
    // await this.sendConfirmation(id);
    // }
    return response;
  }

  async validateCoupon(id, companyId) {
    try {
      const coupon = await this.getCoupon(id);

      if (coupon && coupon.id) {
        const { status, dealId } = coupon;
        const deal = await this.getDeal(dealId);
        console.log("DEAL", deal);
        const expirationDate = new Date(deal.expire * 1000);
        //   console.log(expirationDate);
        const currentDate = new Date();
        console.log(currentDate < expirationDate);
        if (deal.companyId == companyId || companyId == "99999") {
          if (status == 1) {
            if (currentDate <= expirationDate) {
              // this.redeemCoupon(coupon.id);
              return {
                couponId: coupon.id,
                isValid: true,
                deal,
                hash: coupon.hash
              };
            } else {
              console.log("This coupon is expired");
              return {
                error: "Could not redeem coupon, it is expired",
                isValid: false
              };
            }
          } else {
            console.log("This coupon has been previously redeemed");
            return {
              error: "Could not redeem coupon, it has been previously redeemed",
              isValid: false
            };
          }
        } else {
          console.log("This coupon does not belong to this merchant");
          return {
            error: "This coupon does not belong to this merchant",
            isValid: false
          };
        }
      } else {
        console.log("This coupon does not exist");
        return { error: "Coupon does not exist", isValid: false };
      }
    } catch (e) {
      console.log(e);
    }
  }

  async getUserEmail(userId) {
    const form = new FormData();
    form.append("query", "SELECT * FROM cpnc_User WHERE id = " + userId);
    const result = await fetch("https://megusta.do/reports/queries", {
      headers: form.getHeaders(),
      method: "POST",
      body: form
    });

    const response = await result.json();
    console.log(response);
    return { email: response[0].email };
  }
  async getCompanyEmail(dealId) {
    const form = new FormData();
    form.append(
      "query",
      "SELECT cpnc_User.email FROM cpnc_Deal INNER JOIN cpnc_Company ON cpnc_Deal.companyId=cpnc_Company.id INNER JOIN cpnc_User ON cpnc_Company.userId=cpnc_User.id WHERE cpnc_Deal.id = " +
        dealId
    );
    const result = await fetch("https://megusta.do/reports/queries", {
      headers: form.getHeaders(),
      method: "POST",
      body: form
    });

    const response = await result.json();
    console.log(response);
    return response[0];
  }
 
  async redeemConfirmation(id, companyId) {
    const form = new FormData();
    form.append("query", "UPDATE cpnc_DealCoupon SET status=2 WHERE id=" + id);
    console.log(id);
    // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
    const result = await fetch("https://megusta.do/reports/queries/action", {
      headers: form.getHeaders(),
      method: "POST",
      body: form
    });
    const response = await result.json();
    
    if (response && response.updated) {
        console.log("RESPONSEEEE", response);
      await this.sendConfirmation(id, companyId);
      return response;
    }
    
  }

  async sendConfirmation(couponId, companyId) {
    console.log("CHEQUIANDO",couponId, companyId)
    const form = new FormData();
    form.append("query", "SELECT * FROM cpnc_DealCoupon WHERE id=" + couponId);

    // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
    const result = await fetch("https://megusta.do/reports/queries", {
      headers: form.getHeaders(),
      method: "POST",
      body: form
    });
    const response = await result.json();
    console.log(response);
    
    // const response = await result.json();

    const { dealId, userId } = response[0];

    const userEmail = await this.getUserEmail(userId);


    const fideclubResponse = await fetch('https://api.sunchat.com/v1/stores/'+companyId);
    const fideclubData = await fideclubResponse.json();
    const utils = {terminalId:fideclubData.store.configurations.terminal_id, merchantId:fideclubData.store.merchant_id, storeUser:fideclubData.store.user.id};
    console.log(utils);

    const order = await this.makeOrder(userEmail.email,"0.00", utils );
    console.log(order);

  }
  async makeOrder(email, amount, utils) {
    const formData = new FormData();
    formData.append("user", utils.storeUser.toString());
    formData.append("customer_phone", email);
   
    formData.append("amount", amount);
    formData.append("terminal_id", utils.terminalId);
    formData.append("merchant_id", utils.merchantId);
    formData.append("game_id", "0");
    formData.append("reference", "PDV-" + utils.terminalId);
    
    try {
      let result = await fetch("https://api.sunchat.com/v2/orders", {method:"POST", body:formData});
      const finalResult = await result.json();
      console.log("EY FINAI", finalResult);
      return finalResult;
    } catch (e) {
      console.log(e);
      return e;
    }
  }
}
