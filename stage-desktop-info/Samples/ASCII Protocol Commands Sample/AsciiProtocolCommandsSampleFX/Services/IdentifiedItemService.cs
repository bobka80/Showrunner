//-----------------------------------------------------------------------
// <copyright file="IdentifiedItemService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Entities;
    using log4net;
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Provides methods to add items to the cache
    /// </summary>
    public interface IIdentifiedItemCache
    {        
        /// <summary>
        /// Adds the transponder to the cache
        /// </summary>
        /// <param name="transponder">The item to add</param>
        void AddTransponder(TransponderData transponder);

        /// <summary>
        /// Adds the barcode to the cache
        /// </summary>
        /// <param name="barcode">The item to add</param>
        void AddBarcode(BarcodeEventArgs barcode);
    }

    /// <summary>
    /// Provides a central cache of all the unique identifies seen
    /// </summary>
    public class IdentifiedItemService
        : IIdentifiedItemCache
    {
        /// <summary>
        /// Provides logging for this class
        /// </summary>
        private static ILog log = LogManager.GetLogger(typeof(IdentifiedItemService));

        /// <summary>
        /// Holds the collection of items
        /// </summary>
        private IList<IIdentifiedItem> identifiers;

        /// <summary>
        /// Backing field for SelectedItem
        /// </summary>
        private IIdentifiedItem selectedItem;

        /// <summary>
        /// Initializes a new instance of the IdentifiedItemService class
        /// </summary>
        public IdentifiedItemService()
        {
            this.identifiers = new List<IIdentifiedItem>();
        }

        /// <summary>
        /// Raised when the collection is reset
        /// </summary>
        public event EventHandler Cleared;

        /// <summary>
        /// Raised when an item is added or updated
        /// </summary>
        public event EventHandler<IIdentifiedItemEventArgs> ItemChanged;

        /// <summary>
        /// Raised when the selected item changes
        /// </summary>
        public event EventHandler<IIdentifiedItemEventArgs> SelectedItemChanged;

        /// <summary>
        /// Gets or sets the selected item in the cache
        /// </summary>
        public IIdentifiedItem SelectedItem
        {
            get
            {
                return this.selectedItem;
            }

            set
            {
                if (this.selectedItem != value)
                {
                    this.selectedItem = value;
                    this.OnSelectedItemChanged(this.selectedItem);
                }
            }
        }

        /// <summary>
        /// Add the item to the cache
        /// </summary>
        /// <param name="value">The item to add</param>
        public void Add(IIdentifiedItem value)
        {
            IIdentifiedItem result;

            if (value == null)
            {
                throw new ArgumentNullException("value");
            }

            result = value;
            this.identifiers.Add(result);
            //if (this.identifiers.ContainsKey(value.Key))
            //{
            //    result = this.identifiers[value.Key];
            //    result.LastSeen = value.LastSeen;

            //    log.DebugFormat("Updated: {0}", result);
            //}
            //else
            //{
            //    this.identifiers.Add(value.Key, value);
            //    result = value;

            //    log.DebugFormat("Added:  {0}", result);
            //}

            this.OnItemChanged(result);
        }

        /// <summary>
        /// Adds the transponder to the cache
        /// </summary>
        /// <param name="transponder">The item to add</param>
        public void AddTransponder(TransponderData transponder)
        {
            this.Add(transponder.ToIdentifiedItem());
        }

        /// <summary>
        /// Adds the barcode to the cache
        /// </summary>
        /// <param name="barcode">The item to add</param>
        public void AddBarcode(BarcodeEventArgs barcode)
        {
            this.Add(barcode.ToIdentifiedItem());
        }

        /// <summary>
        /// Clear the cache
        /// </summary>
        public void Clear()
        {
            this.SelectedItem = null;
            this.identifiers.Clear();
            this.OnCleared();
        }

        /// <summary>
        /// Call to raise the <see cref="Cleared"/> event
        /// </summary>
        protected virtual void OnCleared()
        {
            EventHandler handler;

            handler = this.Cleared;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }

        /// <summary>
        /// Call to raise the <see cref="ItemChanged"/> event
        /// </summary>
        /// <param name="value">The item changed</param>
        protected virtual void OnItemChanged(IIdentifiedItem value)
        {
            EventHandler<IIdentifiedItemEventArgs> handler;

            handler = this.ItemChanged;
            if (handler != null)
            {
                handler(this, new IIdentifiedItemEventArgs(value));
            }
        }

        /// <summary>
        /// Call to raise the <see cref="SelectedItemChanged"/>
        /// </summary>
        /// <param name="value">The new selected item</param>
        protected virtual void OnSelectedItemChanged(IIdentifiedItem value)
        {
            EventHandler<IIdentifiedItemEventArgs> handler;

            handler = this.SelectedItemChanged;
            if (handler != null)
            {
                handler(this, new IIdentifiedItemEventArgs(value));
            }
        }        
    }
}
