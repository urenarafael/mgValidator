import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import * as FormData from 'form-data';
@Injectable()
export class CouponService {


    async getCoupon(id) {
        try {
            const form = new FormData();
            form.append('query', 'SELECT * FROM cpnc_DealCoupon  where redemptionCode = ' + id);
            // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
            // console.log(form);
            const result = await fetch("https://megusta.do/reports/queries", { headers: form.getHeaders(), method: 'POST', body: form });
            const response = await result.json();
            return response[0];
        } catch (e) {
            console.log(e);
        }
    }
    async getDeal(id) {
        const form = new FormData();
        //11571

        form.append('query', "SELECT * FROM cpnc_Deal INNER JOIN cpnc_DealI18N ON cpnc_Deal.id = cpnc_DealI18N.dealId WHERE cpnc_Deal.id = " + id + " AND cpnc_DealI18N.name='name'");
        // form.append('query', 'SELECT * FROM cpnc_Deal  WHERE id = '+ id );
        // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
        const result = await fetch("https://megusta.do/reports/queries", { headers: form.getHeaders(), method: 'POST', body: form });
        const response = await result.json();
        console.log(response);
        return response[0];
    }
    async redeemCoupon(id) {
        const form = new FormData();
        form.append('query', 'UPDATE cpnc_DealCoupon SET status=2 WHERE id=' + id);
        console.log(id);
        // form.append('query', 'SELECT * FROM cpnc_User  where lastName like "%Penz%" limit 12');
        const result = await fetch("https://megusta.do/reports/queries/action", { headers: form.getHeaders(), method: 'POST', body: form });
        const response = await result.json();
        return response[0];
    }

    async validateCoupon(id, companyId) {
        try {

            //   console.log("EL ID", id, companyId);

            const coupon = await this.getCoupon(id);
            //   console.log(await coupon.dealId)
            //   console.log(await this.getDeal(coupon.dealId));


            if (coupon && coupon.id) {
                const { status, dealId } = coupon;
                const deal = await this.getDeal(dealId);
                console.log("DEAL", deal);
                const expirationDate = new Date(deal.expire * 1000);
                //   console.log(expirationDate);
                const currentDate = new Date();
                console.log(currentDate < expirationDate);
                if (deal.companyId == companyId) {


                    if (status == 1) {
                        if (currentDate <= expirationDate) {
                            // this.redeemCoupon(coupon.id);
                            return ({ couponId: coupon.id, isValid: true, deal });

                        } else {
                            console.log("This coupon is expired");
                            return ({ error: "Could not redeem coupon, it is expired", isValid: false });
                        }
                    } else {
                        console.log("This coupon has been previously redeemed");
                        return ({ error: "Could not redeem coupon, it has been previously redeemed", isValid: false });
                    }
                } else {
                    console.log("This coupon does not belong to this merchant");
                    return ({ error: "This coupon does not belong to this merchant", isValid: false });
                }
            } else {
                console.log("This coupon does not exist");
                return ({ error: "Coupon does not exist", isValid: false });
            }

        } catch (e) {
            console.log(e);
        }
    }
}
