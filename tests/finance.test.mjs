import test from 'node:test';
import assert from 'node:assert/strict';
import {calcQuoteTotal, money, customerName, dateLabel} from '../src/lib/utils.ts';

test('proposal scenario: 500-guest wedding with decor totals one million',()=>{
  const lines=[{quantity:500,unit_price:1600},{quantity:1,unit_price:200000}];
  assert.equal(calcQuoteTotal(lines,0,0),1000000);
  const payments=300000;
  const expenses=750000;
  assert.equal(calcQuoteTotal(lines)-payments,700000);
  assert.equal(calcQuoteTotal(lines)-expenses,250000);
});
test('discount applied before tax',()=>{
  assert.equal(calcQuoteTotal([{quantity:5,unit_price:100}],100,10),440);
});
test('rounds to cents',()=>{
  assert.equal(calcQuoteTotal([{quantity:3,unit_price:0.1}],0,5),0.32);
});
test('money and related customer rendering',()=>{
  assert.match(money(1000000),/1,000,000/);
  assert.equal(customerName({full_name:'Sample User'}),'Sample User');
  assert.equal(customerName([{full_name:'Sample User'}]),'Sample User');
  assert.match(dateLabel('2027-01-11'),/Jan/);
});
