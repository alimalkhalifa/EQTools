import { Model, INTEGER, STRING, FLOAT, Sequelize, ModelAttributes } from 'sequelize';

let Schema: ModelAttributes = {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  name: {
    type: STRING,
    allowNull: false
  },

  spawn_limit: {
    type: INTEGER,
    allowNull: false
  },

  dist: {
    type: FLOAT,
    allowNull: false
  },

  max_x: {
    type: FLOAT,
    allowNull: false
  },

  min_x: {
    type: FLOAT,
    allowNull: false
  },

  max_y: {
    type: FLOAT,
    allowNull: false
  },

  min_y: {
    type: FLOAT,
    allowNull: false
  },

  delay: {
    type: INTEGER,
    allowNull: false
  },

  mindelay: {
    type: INTEGER,
    allowNull: false
  },

  despawn: {
    type: INTEGER,
    allowNull: false
  },

  despawn_timer: {
    type: INTEGER,
    allowNull: false
  },

  wp_spawns: {
    type: INTEGER,
    allowNull: false
  }
}

export default class SpawngroupModel extends Model {
  [key: string]: any;
  id!: number;
  name!: string;
  spawn_limit!: number;
  dist!: number;
  max_x!: number;
  min_x!: number;
  max_y!: number;
  min_y!: number;
  delay!: number;
  mindelay!: number;
  despawn!: number;
  despawn_timer!: number;
  wp_spawns!: number;
};

export function initSpawngroupModel(connection: Sequelize) {
  SpawngroupModel.init(Schema,
  {
    sequelize: connection,
    tableName: 'spawngroup',
    timestamps: false
  });
}
