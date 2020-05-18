import { Model, INTEGER, STRING, FLOAT, Sequelize, ModelAttributes } from 'sequelize';

let Schema: ModelAttributes = {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  spawngroupID: {
    type: INTEGER,
    allowNull: false
  },

  zone: {
    type: STRING,
    allowNull: false
  },

  version: {
    type: INTEGER,
    allowNull: false
  },

  x: {
    type: FLOAT,
    allowNull: false
  },

  y: {
    type: FLOAT,
    allowNull: false
  },

  z: {
    type: FLOAT,
    allowNull: false
  },

  heading: {
    type: FLOAT,
    allowNull: false
  },

  respawntime: {
    type: INTEGER,
    allowNull: false
  },

  variance: {
    type: INTEGER,
    allowNull: false
  },

  pathgrid: {
    type: INTEGER,
    allowNull: false
  },

  _condition: {
    type: INTEGER,
    allowNull: false
  },

  cond_value: {
    type: INTEGER,
    allowNull: false
  },

  enabled: {
    type: INTEGER,
    allowNull: false
  },

  animation: {
    type: INTEGER,
    allowNull: false
  },

  min_expansion: {
    type: INTEGER,
    allowNull: false
  },

  max_expansion: {
    type: INTEGER,
    allowNull: false
  }
}

export default class Spawn2Model extends Model {
  [key: string]: any;
  id!: number;
  spawngroupID!: number;
  zone!: string;
  version!: number;
  x!: number;
  y!: number;
  z!: number;
  heading!: number;
  respawntime!: number;
  variance!: number;
  pathgrid!: number;
  _condition!: number;
  cond_value!: number;
  enabled!: number;
  animation!: number;
  min_expansion!: number;
  max_expansion!: number;
};

export function initSpawn2Model(connection: Sequelize) {
  Spawn2Model.init(Schema,
  {
    sequelize: connection,
    tableName: 'spawn2',
    timestamps: false
  });
}
