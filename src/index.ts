const express = require("express");
const cors = require("cors");

import fs, { readFile } from "fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  Point,
  Polygon,
  doCustomPolygonsIntersect,
} from "./doPolygonIntersect";

const keys = JSON.parse(fs.readFileSync("secret/key.json", "utf8")).backend;
const ACCESS_KEY = keys.accessKey;
const SECRET_ACCESS_KEY = keys.secretAccessKey;
const REGION = "ap-northeast-2";
const s3 = new S3Client({
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_ACCESS_KEY },
});

// const run = async (): Promise<string> => {
//   try {
//     // const results = await s3.send(
//     //   new PutObjectCommand({
//     //     Bucket: "seoulpanorama2123-readonly-test-1",
//     //     Key: "key.txt",
//     //     Body: "bodfy",
//     //   })
//     // );
//     const results2 = await s3.send(
//       new GetObjectCommand({
//         Bucket: "seoulpanorama2123-private",
//         Key: "user_names.json",
//       })
//     );
//     console.log("success");
//     // console.log(results);
//     const str = (await results2.Body?.transformToString()) || "";
//     console.log(str);
//     const user_names = fs.readFileSync(__dirname + "/../data/user_names.json");
//     console.log(JSON.parse(user_names.toString("utf-8")));
//     const results3 = await s3.send(
//       new PutObjectCommand({
//         Bucket: "seoulpanorama2123-private",
//         Key: "user_names.json",
//         Body: user_names,
//       })
//     );
//     console.log("success");

//     return str;
//   } catch (e: any) {
//     console.log("error");
//     console.log(e);
//     console.log({ ...e });
//     // e.name === "NoSuchKey",
//     // e.name === "NoSuchBucket",
//     // e.name === "PermanentRedirect",
//     // e.name === "AccessDenied",
//   }
//   return "";
// };

var app = express();

// app.opts

const WHITE_LIST = [
  "https://seoulpanorama2123.com",
  "https://test.seoulpanorama2123.com",
  "https://www.seoulpanorama2123.com",
  "https://localhost:3400",
  "http://localhost:3400",
];

app.use(
  cors({
    origin: WHITE_LIST,
    credentials: true, // defaults to false
    // headers: ['x-foo']                 // sets expose-headers
  })
);

type Request<T> = { body: T };
type Response<T> = {
  send: (data: T) => void;
  type: (data: any) => void;
  header: (key: string, val: string) => void;
};

// app.use((req: Request<void>, res: Response<void>) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Origin",
//     "https://test.seoulpanorama2123.com"
//   );
// });

// app.use(
//   cors({
//     origins: ["https://api.propi.moohae.net"],
//   })
// );

const port = 3401;
app.set("port", port);
app.use(express.json({ limit: "5000mb" }));
app.use(express.urlencoded({ limit: "5000mb", extended: false }));

app.get("/", (req: Request<{}>, res: Response<string | { test: string }>) => {
  res.send("server testing ok");
  console.log("server testing ok");
});

app.put(
  "/name",
  (req: Request<{ name: string }>, res: Response<{ state: string }>) => {
    _registerName(req.body.name)
      .then((state) => {
        res.send({ state });
      })
      .catch((e) => {
        console.log(e);
        res.send({ state: "error" });
      });
  }
);

app.get(
  "/uploaded_user_names",
  (req: Request<void>, res: Response<string[]>) => {
    _getUploadedUserNames()
      .then((name_list) => {
        res.send(name_list);
      })
      .catch((e) => {
        console.log(e);
        res.send([]);
      });
  }
);

app.get("/ranked_user_names", (req: Request<void>, res: Response<string[]>) => {
  _getRankedUserNames()
    .then((name_list) => {
      res.send(name_list);
    })
    .catch((e) => {
      console.log(e);
      res.send([]);
    });
});

app.put(
  "/user_info",
  (req: Request<{ user_name: string }>, res: Response<any>) => {
    // console.log(req)
    _getDevelopmentData("info/" + req.body.user_name)
      .then((file) => {
        res.send(file);
        // res.send(file);
      })
      .catch((e) => {
        console.log(e);
        res.send("error");
      });
  }
);

app.put(
  "/easter_egg",
  (req: Request<{ name: string }>, res: Response<{ state: string }>) => {
    _registerEasterEgg(req.body.name)
      .then((state) => {
        res.send({ state });
      })
      .catch((e) => {
        console.log(e);
        res.send({ state: "error" });
      });
  }
);

type TuringTestStatistics = {
  each_data: { [keys: string]: number };
  total: number;
  correct: number;
};

app.put(
  "/turingtest",
  (
    req: Request<{ clicked_cards: Array<string> }>,
    res: Response<TuringTestStatistics>
  ) => {
    _registerTuringTestData(req.body.clicked_cards)
      .then((statistics) => {
        res.send(statistics);
      })
      .catch((e) => {
        console.log(e);
        res.send({ each_data: {}, total: 0, correct: 0 });
      });
  }
);

type DevelopmentScore = {
  user_name: string;
  l: number;
  b: number;
  p: number;
};

type ScoreData = {
  l: { [keys: string]: number };
  b: { [keys: string]: number };
  p: { [keys: string]: number };
};

app.put(
  "/score",
  (req: Request<DevelopmentScore>, res: Response<ScoreGraphData>) => {
    _registerScoreData(req.body)
      .then((bool) => {
        if (bool) {
          _getScoreGraphData(HISTOGRAM_DIVIDING_NUMBER, MAX_SCORE)
            .then((output) => res.send(output))
            .catch((e) => {
              // console.log(e);
              res.send(default_score_graph_data);
            });
        } else {
          res.send(default_score_graph_data);
        }
      })
      .catch((e) => {
        console.log(e);
        res.send(default_score_graph_data);
      });
  }
);

type ScoreGraphEachData = {
  mean: number;
  stdev: number;
  values: number[];
  max_score: number;
};

type ScoreGraphData = {
  l: ScoreGraphEachData;
  b: ScoreGraphEachData;
  p: ScoreGraphEachData;
};

const default_score_graph_data: ScoreGraphData = {
  l: { mean: 0, stdev: 0, values: [], max_score: 5 },
  b: { mean: 0, stdev: 0, values: [], max_score: 5 },
  p: { mean: 0, stdev: 0, values: [], max_score: 5 },
};

const HISTOGRAM_DIVIDING_NUMBER = 20;
const MAX_SCORE = 5;

app.get("/score", (req: Request<void>, res: Response<ScoreGraphData>) => {
  _getScoreGraphData(HISTOGRAM_DIVIDING_NUMBER, MAX_SCORE)
    .then((output) => res.send(output))
    .catch((e) => {
      console.log(e);
      res.send(default_score_graph_data);
    });
});

type MultiLanString = { eng: string; kor: string };
type Vector = [number, number, number];

type RegionPolygonData = {
  [keys: string]: {
    region_polygon: [number, number][];
    l: number;
    b: number;
    p: number;
  };
};

type RankedRegionPolygonData = {
  [keys: string]: RegionPolygonData;
};

app.put(
  "/ranked_region_polygon_data",
  (
    req: Request<{ region_no: number }>,
    res: Response<RegionPolygonData | false>
  ) => {
    _getRankedRegionPolygonData(req.body.region_no)
      .then((data) => {
        res.send(data);
      })
      .catch((e) => {
        console.log(e);
        res.send(false);
      });
  }
);

type DevelopmentInfo = {
  user_name: string;
  cam_pos: Vector;
  position: Vector;
  internal_score: {
    l: number;
    b: number;
    p: number;
    l_converted: number;
    b_converted: number;
    p_converted: number;
    tot_converted: number;
  };
  this_region_data: {
    name: number;
    elevation: MultiLanString;
    direction: MultiLanString;
    factor: MultiLanString;
    bldg_score_data: {
      [keys: string]: {
        b: number;
        l: number;
        p: number;
        minus: MultiLanString[];
      };
    };
  };
  region_polygon: [number, number][];
  rankable: boolean | undefined;
  overlapping_users: string[];
};

type DevelopmentData = {
  user_name: string;
  background_state: unknown;
  bldg_state: unknown;
};

type DevelopmentModeling = {
  user_name: string;
  modeling: unknown;
};

app.put(
  "/upload/info",
  (req: Request<DevelopmentInfo>, res: Response<boolean>) => {
    _registerUploadedAndRankedData(req.body)
      .then(() => {
        _registerNamedData("development/info", req.body.user_name, req.body)
          .then((bool) => {
            res.send(bool);
          })
          .catch((e) => {
            console.log(e);
            res.send(false);
          });
      })
      .catch((e) => {
        console.log(e);
        res.send(false);
      });
  }
);

const _registerUploadedAndRankedData = async (info: DevelopmentInfo) => {
  console.log("rankable :", info.rankable);
  const real_user_name = info.user_name?.split("_")?.[0];
  const real_user_name_to_delete = [
    ...(info.overlapping_users || []),
    real_user_name,
  ];
  console.log("real user name to delete :", real_user_name_to_delete);
  if (info.rankable) {
    const user_names: string[] = JSON.parse(
      fs
        .readFileSync(__dirname + "/../data/ranked_user_names.json")
        .toString("utf-8")
    );
    const region_polygon_data: RankedRegionPolygonData = JSON.parse(
      fs
        .readFileSync(__dirname + "/../data/ranked_region_polygon_data.json")
        .toString("utf-8")
    );
    while (true) {
      // console.log(real_user_name_to_delete)
      const ranked_list_idx = user_names.findIndex((e) =>
        real_user_name_to_delete.includes(e.split("_")?.[0])
      );
      // console.log(ranked_list_idx, user_names[ranked_list_idx])
      if (ranked_list_idx > -1) {
        user_names.splice(ranked_list_idx, 1);
      } else {
        break;
      }
    }
    user_names.push(info.user_name);
    Object.keys(region_polygon_data).forEach((key) => {
      real_user_name_to_delete.forEach((name) => {
        // console.log(region_polygon_data[key][name])
        delete region_polygon_data[key][name];
      });
    });
    if (region_polygon_data[info.this_region_data.name.toString()]) {
      region_polygon_data[info.this_region_data.name.toString()][
        real_user_name
      ] = {
        region_polygon: info.region_polygon,
        l: info.internal_score.l,
        b: info.internal_score.b,
        p: info.internal_score.p,
      };
    }
    const _ = fs.writeFileSync(
      __dirname + "/../data/ranked_user_names.json",
      JSON.stringify(user_names)
    );
    const __ = fs.writeFileSync(
      __dirname + "/../data/ranked_region_polygon_data.json",
      JSON.stringify(region_polygon_data)
    );
    const ___ = await s3.send(
      new PutObjectCommand({
        Bucket: "seoulpanorama2123-private",
        Key: "ranked_user_names.json",
        Body: JSON.stringify(user_names),
      })
    );
    const ____ = await s3.send(
      new PutObjectCommand({
        Bucket: "seoulpanorama2123-private",
        Key: "ranked_region_polygon_data.json",
        Body: JSON.stringify(region_polygon_data),
      })
    );
    console.log(`registered ranked name : ${info.user_name}`);
  }
  const user_names: string[] = JSON.parse(
    fs
      .readFileSync(__dirname + "/../data/uploaded_user_names.json")
      .toString("utf-8")
  );
  while (true) {
    const uploaded_list_idx = user_names.findIndex((e) =>
      e.split("_").includes(real_user_name)
    );
    if (uploaded_list_idx > -1) {
      user_names.splice(uploaded_list_idx, 1);
    } else {
      break;
    }
  }
  user_names.push(info.user_name);
  const _ = fs.writeFileSync(
    __dirname + "/../data/uploaded_user_names.json",
    JSON.stringify(user_names)
  );
  const __ = await s3.send(
    new PutObjectCommand({
      Bucket: "seoulpanorama2123-private",
      Key: "uploaded_user_names.json",
      Body: JSON.stringify(user_names),
    })
  );
  console.log(`registered uploaded name : ${info.user_name}`);
};

app.put(
  "/upload/data",
  (req: Request<DevelopmentData>, res: Response<boolean>) => {
    _registerNamedData("development/data", req.body.user_name, req.body)
      .then((bool) => {
        res.send(bool);
      })
      .catch((e) => {
        console.log(e);
        res.send(false);
      });
  }
);

app.put(
  "/upload/modeling",
  (req: Request<DevelopmentModeling>, res: Response<boolean>) => {
    _registerNamedData(
      "development/modeling",
      req.body.user_name,
      req.body.modeling,
      "gltf",
      ""
    )
      .then((bool) => {
        res.send(bool);
      })
      .catch((e) => {
        console.log(e);
        res.send(false);
      });
  }
);

app.put(
  "/upload/silhouette",
  (req: Request<DevelopmentModeling>, res: Response<boolean>) => {
    _registerNamedData(
      "development/silhouette",
      req.body.user_name,
      req.body.modeling,
      "gltf",
      ""
    )
      .then((bool) => {
        res.send(bool);
      })
      .catch((e) => {
        console.log(e);
        res.send(false);
      });
  }
);

app.listen(port, () => {
  console.log("Express listening on port", port);
});

const _registerName = async (name: string): Promise<string> => {
  const user_names = JSON.parse(
    fs.readFileSync(__dirname + "/../data/user_names.json").toString("utf-8")
  );
  if (user_names.indexOf(name) >= 0) {
    console.log(`duplicated name : ${name}`);
    return "duplicated";
  }
  user_names.push(name);
  console.log(JSON.stringify(user_names));
  const _ = fs.writeFileSync(
    __dirname + "/../data/user_names.json",
    JSON.stringify(user_names)
  );
  const __ = await s3.send(
    new PutObjectCommand({
      Bucket: "seoulpanorama2123-private",
      Key: "user_names.json",
      Body: JSON.stringify(user_names),
    })
  );
  console.log(`registered name : ${name}`);
  return "success";
};

const _registerEasterEgg = async (name: string): Promise<string> => {
  const easter_egged_user_names = JSON.parse(
    fs
      .readFileSync(__dirname + "/../data/easter_egged_user_names.json")
      .toString("utf-8")
  );
  if (easter_egged_user_names.indexOf(name) >= 0) {
    console.log(`duplicated name : ${name}`);
    return "duplicated";
  }
  easter_egged_user_names.push(name);
  console.log(JSON.stringify(easter_egged_user_names));
  const _ = fs.writeFileSync(
    __dirname + "/../data/easter_egged_user_names.json",
    JSON.stringify(easter_egged_user_names)
  );
  const __ = await s3.send(
    new PutObjectCommand({
      Bucket: "seoulpanorama2123-private",
      Key: "user_names.json",
      Body: JSON.stringify(easter_egged_user_names),
    })
  );
  console.log(`registered easter egged name : ${name}`);
  return "success";
};

const _getDevelopmentData = async (path: string): Promise<any> => {
  const results2 = await s3.send(
    new GetObjectCommand({
      Bucket: "seoulpanorama2123-private",
      Key: `development/${path}.json`,
    })
  );
  console.log("success");
  const str = results2.Body?.transformToString();
  return str;
};

const turing_test_keys = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

const _registerTuringTestData = async (
  data: Array<string>
): Promise<TuringTestStatistics> => {
  const turing_test_statistics: TuringTestStatistics = JSON.parse(
    fs
      .readFileSync(__dirname + "/../data/turing_test_statistics.json")
      .toString("utf-8")
  );
  const correct = data.length == 2 && data.includes("A") && data.includes("I");
  const each_data: { [keys: string]: number } = {};
  turing_test_keys.forEach((key) => {
    each_data[key] =
      (turing_test_statistics.each_data[key] || 0) +
      (data.includes(key) ? 1 : 0);
  });
  const new_turing_test_statistics: TuringTestStatistics = {
    each_data,
    total: turing_test_statistics.total + 1,
    correct: turing_test_statistics.correct + (correct ? 1 : 0),
  };
  const _ = fs.writeFileSync(
    __dirname + "/../data/turing_test_statistics.json",
    JSON.stringify(new_turing_test_statistics)
  );
  const __ = await s3.send(
    new PutObjectCommand({
      Bucket: "seoulpanorama2123-private",
      Key: "turing_test_statistics.json",
      Body: JSON.stringify(new_turing_test_statistics),
    })
  );
  console.log(
    `turing test statistics updated : ${correct ? "correct" : "wrong"} answer`
  );
  return new_turing_test_statistics;
};
// console.log("d");

const _getRankedRegionPolygonData = async (
  region_no: number | string
): Promise<RegionPolygonData> => {
  const ranked_region_polygon_data: RankedRegionPolygonData = JSON.parse(
    fs
      .readFileSync(__dirname + "/../data/ranked_region_polygon_data.json")
      .toString("utf-8")
  );
  return ranked_region_polygon_data[region_no.toString()];
};

const _getUploadedUserNames = async (): Promise<string[]> => {
  const uploaded_user_names: string[] = JSON.parse(
    fs
      .readFileSync(__dirname + "/../data/uploaded_user_names.json")
      .toString("utf-8")
  );
  return uploaded_user_names;
};

const _getRankedUserNames = async (): Promise<string[]> => {
  const uploaded_user_names: string[] = JSON.parse(
    fs
      .readFileSync(__dirname + "/../data/ranked_user_names.json")
      .toString("utf-8")
  );
  return uploaded_user_names;
};

// const _isRankable = async (
//   region_no: number | string,
//   my_polygon: [number, number][]
// ): Promise<boolean> => {
//   const ranked_region_polygon_data: RankedRegionPolygonData = JSON.parse(
//     fs
//       .readFileSync(__dirname + "/../data/ranked_region_polygon.json")
//       .toString("utf-8")
//   );
//   return Object.values(
//     ranked_region_polygon_data[region_no.toString()] || {}
//   ).reduce(
//     (prev, polygon) =>
//       doCustomPolygonsIntersect(polygon, my_polygon) ? false : prev,
//     true
//   );
// };

const _registerScoreData = async (data: DevelopmentScore): Promise<boolean> => {
  const score_data: ScoreData = JSON.parse(
    fs.readFileSync(__dirname + "/../data/score_data.json").toString("utf-8")
  );
  const real_user_name = data.user_name?.split("_")?.[0];
  score_data.l[real_user_name] = data.l;
  score_data.b[real_user_name] = data.b;
  score_data.p[real_user_name] = data.p;
  const _ = fs.writeFileSync(
    __dirname + "/../data/score_data.json",
    JSON.stringify(score_data)
  );
  const __ = await s3.send(
    new PutObjectCommand({
      Bucket: "seoulpanorama2123-private",
      Key: "score_data.json",
      Body: JSON.stringify(score_data),
    })
  );
  console.log(`score data updated : l=${data.l} ; b=${data.b} ; p=${data.p}`);
  return true;
};

const _getScoreGraphData = async (
  div_number: number,
  max_score: number
): Promise<ScoreGraphData> => {
  const score_data: ScoreData = JSON.parse(
    fs.readFileSync(__dirname + "/../data/score_data.json").toString("utf-8")
  );
  const output: ScoreGraphData = default_score_graph_data;
  ["l", "b", "p"].forEach((key) => {
    const each_values = Object.values<number>(
      score_data[key as "l" | "b" | "p"]
    );
    const length = each_values.length;
    const mean = each_values.reduce((a, b) => a + b, 0) / length;
    const stdev =
      Math.sqrt(
        each_values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0)
      ) / length;
    const values = new Array(div_number)
      .fill(0)
      .map(
        (_, idx) =>
          each_values.filter(
            (val) =>
              val >= (max_score / div_number) * idx &&
              val < (max_score / div_number) * (idx + 1)
          ).length
      );
    // console.log(mean, stdev, div_number, values)
    output[key as "l" | "b" | "p"] = { mean, stdev, values, max_score };
  });
  return output;
};

const _registerNamedData = async (
  path: string,
  name: string,
  data: unknown,
  format: string = "json",
  bucket: string = "-private"
): Promise<boolean> => {
  const __ = await s3.send(
    new PutObjectCommand({
      Bucket: "seoulpanorama2123" + bucket,
      Key: `${path}/${name}.${format}`,
      Body: JSON.stringify(data),
    })
  );
  console.log(`data uploaded : path=${path} ; name=${name}`);
  return true;
};
