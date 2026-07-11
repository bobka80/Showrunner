//-----------------------------------------------------------------------
// <copyright file="InventoryCache.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2010 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Text;

    /// <summary>
    /// Build up statistics of inventory passes
    /// </summary>
    /// TODO: Inventory cache will only support a single consumer!
    public class InventoryCache
    {
        /// <summary>
        /// The list of transponders seen
        /// </summary>
        private Dictionary<string, InventoryItem> cache;  

        /// <summary>
        /// Initializes a new instance of the InventoryCache class
        /// </summary>
        public InventoryCache()
        {
            this.Reset();
        }

        /// <summary>
        /// Raised when an inventory is added to the cache
        /// </summary>
        public event EventHandler Changed;

        /// <summary>
        /// Gets the object used to synchronize access to this object
        /// </summary>
        public object SyncRoot
        {
            get
            {
                return ((System.Collections.IDictionary)this.cache).SyncRoot;
            }
        }

        /// <summary>
        /// Gets a value indicating whether information has been added since the changes were last accepted
        /// </summary>
        public bool IsDirty { get; private set; }

        /// <summary>
        /// Gets the number of inventory passes recorded
        /// </summary>
        public int PassCount { get; private set; }

        /// <summary>
        /// Gets the number of unique transponders added in the last pass
        /// </summary>
        public int PassUniqueTransponderCount { get; private set; }

        /// <summary>
        /// Gets the number of transponders processed in the last pass
        /// </summary>
        public int PassTotalTransponderCount { get; private set; }

        /// <summary>
        /// Gets the total number of unique transponders
        /// </summary>
        public int TotalUniqueTranspondersCount
        {
            get
            {
                if (this.cache == null)
                {
                    return 0;
                }

                return this.cache.Count;
            }
        }

        /// <summary>
        /// Gets the total number of transponders processed
        /// </summary>
        public int TotalTranspondersCount { get; private set; }

        /// <summary>
        /// Gets or sets a TickCount
        /// </summary>
        public long StartTick { get; set; }

        /// <summary>
        /// Gets a value indicating whether the cache was reset since the last accept changes
        /// </summary>
        public bool IsReset { get; private set; }

        public static string GenerateFileName(string fileName)
        {
            string path;
            string temp;

            temp = string.Format(
                CultureInfo.InvariantCulture,
                "{0} {1}.CSV", 
                System.IO.Path.GetFileNameWithoutExtension(fileName),
                DateTime.Now.ToString("yyyyMMddhhmmss", CultureInfo.InvariantCulture));

            path = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(fileName), temp);

            return path;
        }

        /// <summary>
        /// Resets the inventory data
        /// </summary>
        public void Reset()
        {
            this.IsReset = true;
                        
            this.PassCount = 0;
            this.PassTotalTransponderCount = 0;
            this.PassUniqueTransponderCount = 0;
            this.TotalTranspondersCount = 0;

            this.cache = new Dictionary<string, InventoryItem>(10);
            this.IsDirty = true;
            this.OnChanged();
        }

        public bool ContainsTransponder(string text)
        {
            if (!string.IsNullOrEmpty(text))
            {
                return this.cache.ContainsKey(text);
            }

            return false;
        }

        public void AddTransponders(IEnumerable<IIdentifiedItem> transponders)
        {
            int total;
            int unique;
            string transponderText;

            total = 0;
            unique = 0;

            lock (this.SyncRoot)
            {
                foreach (IIdentifiedItem transponder in transponders)
                {
                    transponderText = transponder.UniqueIdentifier;

                    if (this.cache.ContainsKey(transponderText))
                    {
                        this.cache[transponderText].LogSeen(transponder);
                    }
                    else
                    {
                        this.cache.Add(transponderText, new InventoryItem(transponder));
                        unique += 1;
                    }

                    total += 1;
                }

                this.PassCount += 1;
                this.PassTotalTransponderCount = total;
                this.PassUniqueTransponderCount = unique;
                this.TotalTranspondersCount += total;
                this.IsDirty = true;                
            }

            this.OnChanged();
        }        

        public void Save(string fileName)
        {
            System.IO.StreamWriter sw;

            if ((this.cache == null) || (this.cache.Count == 0))
            {
                return;
            }

            try
            {
                sw = new System.IO.StreamWriter(fileName, true);

                try
                {
                    lock (this.SyncRoot)
                    {
                        foreach (InventoryItem item in this.cache.Values)
                        {
                            sw.WriteLine(
                                string.Format(
                                    CultureInfo.InvariantCulture, 
                                    "\"{0}\", {1}", 
                                    item.Identifier, 
                                    item.Count.ToString(CultureInfo.InvariantCulture)));
                        }
                    }
                }
                catch (Exception ex)
                {
                    sw.WriteLine(string.Format(CultureInfo.InvariantCulture, "ERROR, {0}", ex.ToString()));
                }
                finally
                {
                    sw.Close();
                }
            }
            catch (Exception)
            {
                // TODO: no throw the exception let UI catch and display error!
                // MsgBox(ex.Message, MsgBoxStyle.Exclamation, "Failed To Save Inventory")
                // TechnologySolutions.Diagnostics.ErrorReport.LogExceptionToFile(ex, "Failed to save inventory");
                throw;
            }
        }        

        public string[] GetAdded()
        {
            List<string> list;

            lock (this.SyncRoot)
            {
                list = new List<string>();
                foreach (InventoryItem item in this.cache.Values)
                {
                    if (item.State == RecordState.Created)
                    {
                        list.Add(item.Identifier);
                    }
                }
            }

            return list.ToArray();
        }

        /// <summary>
        /// Gets a list of all the unique identifiers currently in the cache
        /// </summary>
        /// <returns>The unique identiifers currently in the cache</returns>
        public string[] GetAll()
        {
            List<string> list;

            lock (this.SyncRoot)
            {
                list = new List<string>();
                foreach (InventoryItem iten in this.cache.Values)
                {
                    list.Add(iten.Identifier);
                }
            }

            return list.ToArray();
        }

        public InventoryItem[] GetChanges()
        {
            List<InventoryItem> list;

            lock (this.SyncRoot)
            {
                list = new List<InventoryItem>();
                foreach (InventoryItem item in this.cache.Values)
                {
                    list.Add(item.Clone());
                }
            }

            return list.ToArray();
        }

        public void AcceptChanges()
        {
            lock (this.SyncRoot)
            {
                foreach (InventoryItem item in this.cache.Values)
                {
                    item.AcceptChanges();
                }
            }

            this.IsReset = false;
            this.IsDirty = false;
        }

        protected virtual void OnChanged()
        {
            EventHandler handler;

            handler = this.Changed;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }
    }
}
