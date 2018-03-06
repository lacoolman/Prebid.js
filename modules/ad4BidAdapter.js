import {BANNER} from 'src/mediaTypes';

const {registerBidder} = require('../src/adapters/bidderFactory');

const BIDDER_CODE = 'ad4';
const DEFAULT_TTL = 300;
const URL = '//prb.perfmelab.com/v1';

function createResponse(response) {
  let bidResponses = [];
  response.seatbid[0].bid.forEach(function (bid) {
    let nurl = bid.nurl.replace("${AUCTION_PRICE}", bid.price).replace("${AUCTION_CURRENCY}", "USD");
    bidResponses.push({
      requestId: bid.impid,
      bidderCode: BIDDER_CODE,
      cpm: bid.price,
      width: bid.w,
      height: bid.h,
      ad: bid.adm + '<img src="' + nurl + '" width="0" height="0">',
      ttl: DEFAULT_TTL,
      creativeId: bid.crid,
      currency: response.cur,
      netRevenue: true
    })
  });

  return bidResponses;
}

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],
  isBidRequestValid: function (bid) {
    if (bid.bidder !== BIDDER_CODE || typeof bid.params === 'undefined') {
      return false;
    }

    return typeof bid.params.placementId !== 'undefined';
  },

  buildRequests: function (validBidRequests) {
    let imps = validBidRequests.map(function (validBidRequest) {
      let sizes = [];
      validBidRequest.sizes.forEach(function (i) {
        sizes.push({
          w: i[0],
          h: i[1]
        })
      });
      let request = {
        placementId: validBidRequest.params.placementId,
        sizes: sizes,
        bidId: validBidRequest.bidId,
      };
      if(validBidRequest.params.hasOwnProperty("bidfloor")) {
        request['bidFloor'] = validBidRequest.params.bidfloor;
      }

      return request;
    });

    let ad4BidRequest = [{
      id: Math.random().toString(36).substr(2, 5),
      imp: imps,
    }];

    return {
      'method': 'POST',
      'url': URL,
      'data': JSON.stringify(ad4BidRequest),
      'options': {
        contentType: 'application/json',
        withCredentials: false
      }
    };
  },

  interpretResponse: function (serverResponse, bidRequests) {
    return createResponse(serverResponse.body);
  },

  getUserSyncs: function (syncOptions, serverResponses) {
    const syncs = [];
    return syncs;
  }
};

registerBidder(spec);

