//-----------------------------------------------------------------------
// <copyright file="IdentifiedItemsViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Entities;
    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.ViewModels;

    public class InventoryViewEventArgs
        : EventArgs
    {
        public InventoryViewEventArgs(IEnumerable<InventoryItem> items, bool reset)
        {
            this.Items = items;
            this.IsReset = reset;
        }

        public IEnumerable<InventoryItem> Items { get; private set; }

        public bool IsReset { get; private set; }
    }

    public class IdentifiedItemsViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for 
        /// </summary>
        private int passCount;

        /// <summary>
        /// Backing field for PassUniqueTranspondersCount
        /// </summary>
        private int passUniqueTranspondersCount;

        /// <summary>
        /// Backing field for PassTotalTranspondersCount
        /// </summary>
        private int passTotalTranspondersCount;

        /// <summary>
        /// Backing field for UniqueTranspondersCount
        /// </summary>
        private int uniqueTranspondersCount;

        /// <summary>
        /// Backing field for TotalTransponderCount
        /// </summary>
        private int totalTranspondersCount;

        /// <summary>
        /// Used for synchronization
        /// </summary>
        private object sync = new object();

        /// <summary>
        /// Initializes a new instance of the IdentifiedItemsViewModel class
        /// </summary>
        public IdentifiedItemsViewModel(InventoryCache cache)
        {
            this.Cache = cache;
            this.ClearListCommand = new DelegateCommand(this.ExecuteClearList, DelegateCommand.CanExecuteAlways);
            this.SaveListCommand = new DelegateCommand(this.ExecuteSaveList, DelegateCommand.CanExecuteAlways);

            if (this.Cache != null)
            {
                this.Cache.Changed += this.Cache_Changed;
            }
        }

        /// <summary>
        /// Raised when the view should update its view of the cache
        /// </summary>
        public event EventHandler<InventoryViewEventArgs> Update;

        /// <summary>
        /// Gets the number of inventory passes
        /// </summary>
        public int PassCount
        {
            get
            {
                return this.passCount;
            }

            private set
            {
                if (this.passCount != value)
                {
                    this.passCount = value;
                    this.OnPropertyChanged("PassCount");
                }
            }
        }

        /// <summary>
        /// Gets the number of unique transponders from the last inventory execution
        /// </summary>
        public int PassUniqueTranspondersCount
        {
            get
            {
                return this.passUniqueTranspondersCount;
            }

            private set
            {
                if (this.passUniqueTranspondersCount != value)
                {
                    this.passUniqueTranspondersCount = value;
                    this.OnPropertyChanged("PassUniqueTranspondersCount");
                }
            }
        }

        /// <summary>
        /// Gets the total number of transponders from the last inventory execution
        /// </summary>
        public int PassTotalTranspondersCount
        {
            get
            {
                return this.passTotalTranspondersCount;
            }

            private set
            {
                if (this.passTotalTranspondersCount != value)
                {
                    this.passTotalTranspondersCount = value;
                    this.OnPropertyChanged("PassTotalTranspondersCount");
                }
            }
        }

        /// <summary>
        /// Gets the total number of unique transponders read
        /// </summary>
        public int UniqueTranspondersCount
        {
            get
            {
                return this.uniqueTranspondersCount;
            }

            private set
            {
                if (this.uniqueTranspondersCount != value)
                {
                    this.uniqueTranspondersCount = value;
                    this.OnPropertyChanged("UniqueTranspondersCount");
                }
            }
        }

        /// <summary>
        /// Gets the total number of transponders read
        /// </summary>
        public int TotalTranspondersCount
        {
            get
            {
                return this.totalTranspondersCount;
            }

            private set
            {
                if (this.totalTranspondersCount != value)
                {
                    this.totalTranspondersCount = value;
                    this.OnPropertyChanged("TotalTranspondersCount");
                }
            }
        }

        /// <summary>
        /// Gets the command to clear the list
        /// </summary>
        public ICommand ClearListCommand { get; private set; }

        /// <summary>
        /// Gets the command to save the list
        /// </summary>
        public ICommand SaveListCommand { get; private set; }

        /// <summary>
        /// Gets or sets the cache of items
        /// </summary>
        private InventoryCache Cache { get; set; }

        /// <summary>
        /// Raises the Update event
        /// </summary>
        /// <param name="items">The items in the cache that have changed</param>
        /// <param name="reset">True if the entire list should be reset</param>
        protected virtual void OnUpdate(IEnumerable<InventoryItem> items, bool reset)
        {
            EventHandler<InventoryViewEventArgs> handler;

            handler = this.Update;
            if (handler != null)
            {
                handler(this, new InventoryViewEventArgs(items, reset));
            }
        }

        /// <summary>
        /// Clears the cache
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteClearList(object parameter)
        {
            this.Cache.Reset();
        }

        /// <summary>
        /// Saves the cache
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSaveList(object parameter)
        {
            string path;

            path = System.IO.Path.Combine(
                System.Environment.GetFolderPath(Environment.SpecialFolder.Personal),
                "Inventory");

            this.Cache.Save(InventoryCache.GenerateFileName(path));
        }

        private void Cache_Changed(object sender, EventArgs e)
        {
            Dispatcher.InvokeIfRequired(delegate
            {
                bool reset;
                IEnumerable<InventoryItem> changes;

                this.PassCount = this.Cache.PassCount;
                this.PassUniqueTranspondersCount = this.Cache.PassUniqueTransponderCount;
                this.PassTotalTranspondersCount = this.Cache.PassTotalTransponderCount;
                this.UniqueTranspondersCount = this.Cache.TotalUniqueTranspondersCount;
                this.TotalTranspondersCount = this.Cache.TotalTranspondersCount;

                lock (this.sync)
                {
                    changes = this.Cache.GetChanges();
                    reset = this.Cache.IsReset;
                    this.Cache.AcceptChanges();
                }

                this.OnUpdate(changes, reset);
            });
        }
    }
}
