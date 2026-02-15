import * as StockReturnedService from "../services/stockReturned.service.js";

export const createStockReturned = async (req, res) => {
  try {
    const stockReturned = await StockReturnedService.createStockReturned(
      req.body
    );
    res.status(201).json(stockReturned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStockReturned = async (req, res) => {
  try {
    const stockReturned = await StockReturnedService.getAllStockReturned(
      req.query
    );
    res.status(200).json(stockReturned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStockReturnedById = async (req, res) => {
  try {
    const stockReturned = await StockReturnedService.getStockReturnedById(
      req.params.id
    );
    res.status(200).json(stockReturned);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateStockReturned = async (req, res) => {
  try {
    const stockReturned = await StockReturnedService.updateStockReturned(
      req.params.id,
      req.body
    );
    res.status(200).json(stockReturned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStockReturned = async (req, res) => {
  try {
    const stockReturned = await StockReturnedService.deleteStockReturned(
      req.params.id
    );
    res.status(200).json(stockReturned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStockReturnedStats = async (req, res) => {
  try {
    const stats = await StockReturnedService.getStockReturnedStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
