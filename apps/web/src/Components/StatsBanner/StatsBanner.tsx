import React, { useEffect, useState } from "react";
import { Paper, Typography, Grid, Stack, Box } from "@mui/material";
import axios from "axios";
import {
  DATETIME_WEEK1_START,
  DATETIME_WEEK2_START,
  STAKING_CTC_INFO,
} from "@repo/voix";
import moment from "moment";
import { microalgosToAlgos } from "algosdk";
import { NumericFormat } from "react-number-format";

interface Stat {
  label: string;
  value: number[];
}

interface StatsBannerProps {
  stats: Stat[];
}

const StatsBanner: React.FC<StatsBannerProps> = ({ stats }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  useEffect(() => {
    axios
      .get(
        `https://mainnet-idx.nautilus.sh/v1/scs/accounts?parentId=${STAKING_CTC_INFO}`
      )
      .then(({ data }) => {
        setAccounts(data.accounts);
      });
  }, []);

  // utils

  function computeLockupMultiplier(B2: number, R1: number) {
    if (B2 <= 12) {
      return 0.45 * Math.pow(B2 / R1, 2);
    } else {
      return Math.pow(B2 / R1, 2);
    }
  }

  function computeTimingMultiplier(week: number) {
    switch (week) {
      case 1:
        return 1;
      case 2:
        return 0.8;
      case 3:
        return 0.6;
      case 4:
        return 0.4;
      default:
        return 0;
    }
  }

  const period_limit = 18;

  const computeRate = (week: number) => (period: number) => {
    const lockupMultiplier = computeLockupMultiplier(period, period_limit);
    const timingMultiplier = computeTimingMultiplier(week);
    return lockupMultiplier * timingMultiplier;
  };

  const [stats2, setStats] = useState<Stat[]>([]);
  useEffect(() => {
    if (accounts.length) {
      // generate stats for 4 weeks following start date
      // week1: 0-7 days, week2: 8-14 days, week3: 15-21 days, week4: 22-28 days
      const time0 = moment(new Date(DATETIME_WEEK1_START)).unix();
      const time1 = time0 + 7 * 24 * 60 * 60;
      const time2 = time1 + 7 * 24 * 60 * 60;
      const time3 = time2 + 7 * 24 * 60 * 60;

      const stats = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      let total = 0;
      for (const account of accounts) {
        const { global_deadline, global_initial, global_period } = account;
        console.log(time0, global_deadline, global_initial);
        if (global_deadline < time1) {
          stats[0][0]++;
          stats[0][1] += Number(global_initial);
          stats[0][2] += global_period;
        } else if (global_deadline < time2) {
          stats[1][0]++;
          stats[1][1] += Number(global_initial);
          stats[1][2] += global_period;
        } else if (global_deadline < time3) {
          stats[2][0]++;
          stats[2][1] += Number(global_initial);
          stats[2][2] += global_period;
        } else if (global_deadline > time3) {
          stats[2][0]++;
          stats[2][1] += Number(global_initial);
          stats[2][2] += global_period;
        } else if (global_deadline > time3) {
          stats[3][0]++;
          stats[3][1] += Number(global_initial);
          stats[3][2] += global_period;
        }
        total += Number(global_initial);
      }
      setStats(
        stats.map((stat, index) => ({
          label: `Week ${index + 1}`,
          value: stat,
        }))
      );
    }
  }, [accounts]);

  return (
    <Paper elevation={3} style={{ padding: "20px", marginBottom: "20px" }}>
      <Typography variant="h5" gutterBottom align="center">
        Weekly Stats
      </Typography>
      <Grid container spacing={2}>
        {stats2.map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Typography variant="h6" align="center">
              {stat.label}
            </Typography>
            <Typography variant="body1" align="center">
              <Stack>
                {(([a, b, c]) => {
                  const [count, total, periodTotal] = stat.value;
                  const avgPeriod = Math.round(periodTotal / count);
                  const avgStake = Math.round(total / count);
                  const estBonusRate = computeRate(index + 1)(avgPeriod);
                  const estTotal = total * (estBonusRate + 1);
                  return (
                    <>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <div>Accounts:</div>
                        <div>{a ? a : "-"}</div>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <div>Total Stake:</div>
                        {b ? (
                          <NumericFormat
                            value={microalgosToAlgos(b)}
                            displayType={"text"}
                            thousandSeparator={true}
                            decimalScale={0}
                            fixedDecimalScale={true}
                            suffix=" VOI"
                          />
                        ) : (
                          "-"
                        )}
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <div>Avg Stake:</div>
                        {avgStake ? (
                          <NumericFormat
                            value={microalgosToAlgos(avgStake)}
                            displayType={"text"}
                            thousandSeparator={true}
                            decimalScale={0}
                            fixedDecimalScale={true}
                            suffix=" VOI"
                          />
                        ) : (
                          "-"
                        )}
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <div>Avg Lockup:</div>
                        <div>{avgPeriod ? avgPeriod : "-"}</div>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <div>Est Bonus:</div>
                        <div>
                          {estBonusRate ? (
                            <NumericFormat
                              value={estBonusRate * 100}
                              displayType={"text"}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              suffix="%"
                            ></NumericFormat>
                          ) : (
                            "-"
                          )}
                        </div>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <div>Est Total:</div>
                        <div>
                          {estTotal ? (
                            <NumericFormat
                              value={microalgosToAlgos(Math.floor(estTotal))}
                              displayType={"text"}
                              thousandSeparator={true}
                              decimalScale={0}
                              fixedDecimalScale={true}
                              suffix=" VOI"
                            ></NumericFormat>
                          ) : (
                            "-"
                          )}
                        </div>
                      </Stack>
                    </>
                  );
                })(stat.value)}
              </Stack>
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default StatsBanner;
