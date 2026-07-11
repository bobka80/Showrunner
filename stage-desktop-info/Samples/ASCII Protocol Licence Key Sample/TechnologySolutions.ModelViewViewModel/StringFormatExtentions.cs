//-----------------------------------------------------------------------
// <copyright file="StringFormatExtentions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions
{
    using System;    
    using System.Globalization;
    using System.Text;

    /// <summary>
    /// Extension methods to format a string
    /// </summary>
    public static class StringFormatExtentions
    {
        /// <summary>
        /// Returns the output of the format string using the CurrentUICulture and argument
        /// </summary>
        /// <param name="format">The format string</param>
        /// <param name="args">The arguments for the format string</param>
        /// <returns>The output of string.Format(provider, format, arg0)</returns>
        public static string FormatScreen(this string format, params object[] args)
        {
            return format.Format(CultureInfo.CurrentUICulture, args);
        }

        /// <summary>
        /// Returns the output of the format string with the speicified IFormatProvider and argument
        /// </summary>
        /// <param name="format">The format string</param>
        /// <param name="provider">The format provider</param>
        /// <param name="arg0">The argument for the format string</param>
        /// <returns>The output of string.Format(provider, format, arg0)</returns>
        public static string Format(this string format, IFormatProvider provider, object arg0)
        {
            return string.Format(provider, format, arg0);
        }

        /// <summary>
        /// Returns the output of the format string with the speicified IFormatProvider and arguments
        /// </summary>
        /// <param name="format">The format string</param>
        /// <param name="provider">The format provider</param>
        /// <param name="arg0">The first argument for the format string</param>
        /// <param name="arg1">The second argument for the format string</param>
        /// <returns>The output of string.Format(provider, format, arg0)</returns>
        public static string Format(this string format, IFormatProvider provider, object arg0, object arg1)
        {
            return string.Format(provider, format, arg0, arg1);
        }

        /// <summary>
        /// Returns the output of the format string with the speicified IFormatProvider and arguments
        /// </summary>
        /// <param name="format">The format string</param>
        /// <param name="provider">The format provider</param>
        /// <param name="args">The arguments for the format string</param>
        /// <returns>The output of string.Format(provider, format, arg0)</returns>
        public static string Format(this string format, IFormatProvider provider, params object[] args)
        {
            return string.Format(provider, format, args);
        }
    }
}
